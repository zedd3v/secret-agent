import { ChildProcess, spawn } from 'child_process';
import * as net from 'net';
import { promises as fs, unlink } from 'fs';
import Log from '@secret-agent/commons/Logger';
import { EventEmitter } from 'events';
import { createPromise } from '@secret-agent/commons/utils';
import * as os from 'os';
import { v1 } from 'uuid';

const { log } = Log(module);

let counter = 0;
export default class SocketConnectDriver {
  public readonly socketPath: string;
  public alpn = 'http/1.1';
  public socket: net.Socket;
  public remoteAddress: string;
  public localAddress: string;

  private isClosing = false;
  private isConnected = false;
  private child: ChildProcess;
  private emitter = new EventEmitter();

  constructor(readonly sessionId: string, readonly connectOpts: IGoTlsSocketConnectOpts) {
    const id = (counter += 1);
    this.socketPath =
      os.platform() === 'win32' ? `\\\\.\\pipe\\sa-${v1()}` : `${os.tmpdir()}/sa-mitm-${id}.sock`;

    if (connectOpts.debug === undefined) connectOpts.debug = log.level === 'stats';
    if (connectOpts.isSsl === undefined) connectOpts.isSsl = true;
  }

  public setProxy(url: string, auth?: string) {
    this.connectOpts.proxyUrl = url;
    if (auth) {
      this.connectOpts.proxyAuthBase64 = Buffer.from(auth).toString('base64');
    }
  }

  public setTcpSettings(tcpVars: { windowSize: number; ttl: number }) {
    this.connectOpts.tcpTtl = tcpVars.ttl;
    this.connectOpts.tcpWindowSize = tcpVars.windowSize;
  }

  public on(event: 'close', listener: (socket: net.Socket) => any) {
    this.emitter.on(event, listener);
  }

  public isHttp2() {
    return this.alpn === 'h2';
  }

  public close() {
    if (this.isClosing) return;
    this.isClosing = true;
    this.emitter.emit('close');
    this.cleanupSocket();
    this.closeChild();
  }

  public onListening() {
    const socket = (this.socket = net.connect(this.socketPath));
    socket.on('error', error => {
      log.error('SocketConnectDriver.SocketError', { sessionId: this.sessionId, error });
      if ((error as any)?.code === 'ENOENT') this.close();
    });
    socket.on('end', this.onSocketClose.bind(this, 'end'));
    socket.on('close', this.onSocketClose.bind(this, 'close'));
  }

  public async connect() {
    await this.cleanSocketPathIfNeeded();
    const ext = os.platform() === 'win32' ? '.exe' : '';
    const child = (this.child = spawn(
      `${__dirname}/../socket/connect${ext}`,
      [this.socketPath, JSON.stringify(this.connectOpts)],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    ));
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    const promise = createPromise(30e3);
    child.on('exit', code => {
      promise.reject(new Error('Socket process exited during connect'));
      this.cleanupSocket();
    });

    child.on('error', error => {
      promise.reject(error);
      log.error('SocketConnectDriver.ChildConnectError', { sessionId: this.sessionId, error });
      this.close();
    });

    child.stdout.on('data', message => {
      this.onChildProcessMessage(message);
      if (this.isConnected) {
        promise.resolve();
      }
    });
    // if error logs during connect window, we got a connect error
    child.stderr.on('data', this.onChildProcessStderr.bind(this));
    await promise.promise;
  }

  private async cleanSocketPathIfNeeded() {
    try {
      await fs.unlink(this.socketPath);
    } catch (err) {
      // no action
    }
  }

  private closeChild() {
    if (this.child.killed) return;
    try {
      this.child.stdin.write('disconnect');
    } catch (err) {
      // don't log epipes
    }
    if (os.platform() !== 'win32') {
      this.child.kill();
    }
    this.child.unref();
  }

  private cleanupSocket() {
    if (!this.socket) return;
    this.socket.end();
    unlink(this.socketPath, () => null);
    delete this.socket;
  }

  private onSocketClose(event: string) {
    this.close();
  }

  private onChildProcessMessage(messages: string) {
    for (const message of messages.split(/\r?\n/)) {
      if (message.startsWith('[DomainSocketPiper.Dialed]')) {
        const matches = message.match(/Remote: (.+), Local: (.+)/);
        if (matches?.length) {
          this.remoteAddress = matches[1];
          this.localAddress = matches[2];
        }
      } else if (message === '[DomainSocketPiper.ReadyForConnect]') {
        this.onListening();
      } else if (message.startsWith('[DomainSocketPiper.Connected]')) {
        this.isConnected = true;
        const matches = message.match(/ALPN: (.+)/);
        if (matches?.length) {
          this.alpn = matches[1];
        }
      } else if (message) {
        log.info('SocketHandler.onData', { sessionId: this.sessionId, message });
      }
    }
  }

  private onChildProcessStderr(message: string) {
    log.warn(`SocketConnectDriver.Error => ${message}`, { sessionId: this.sessionId });
    if (
      message.includes('panic: runtime error:') ||
      message.includes('tlsConn.Handshake error') ||
      message.includes('connection refused')
    ) {
      this.socket?.destroy(new Error(message));
      this.close();
    }
  }
}

export interface IGoTlsSocketConnectOpts {
  host: string;
  port: string;
  isSsl?: boolean;
  clientHelloId: string;
  servername: string;
  rejectUnauthorized?: boolean;
  proxyUrl?: string;
  proxyAuthBase64?: string;
  tcpTtl?: number;
  tcpWindowSize?: number;
  debug?: boolean;
  keepAlive?: boolean;
}
