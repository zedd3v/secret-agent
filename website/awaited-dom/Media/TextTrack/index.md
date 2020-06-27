# TextTrack

<div class='overview'>The <code>TextTrack</code> interface—part of the API for handling WebVTT (text tracks on media presentations)—describes and controls the text track associated with a particular <a href="/en-US/docs/Web/HTML/Element/track" title="The HTML <track> element is used as a child of the media elements <audio> and <video>. It lets you specify timed text tracks (or time-based data), for example to automatically handle subtitles. The tracks are formatted in WebVTT format (.vtt files) — Web Video Text Tracks or&nbsp;Timed Text Markup Language (TTML)."><code>&lt;track&gt;</code></a> element.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">activeCues</a>
    <div>A <a class="new" href="/en-US/docs/Web/API/TextTrackCueList" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>TextTrackCueList</code></a> object listing the currently active set of text track cues. Track cues are active if the current playback position of the media is between the cues' start and end times. Thus, for displayed cues such as captions or subtitles, the active cues are currently being displayed.</div>
  </li>
  <li>
    <a href="">cues</a>
    <div>A <a class="new" href="/en-US/docs/Web/API/TextTrackCueList" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>TextTrackCueList</code></a> which contains all of the track's cues.</div>
  </li>
  <li>
    <a href="">id</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> which identifies the track, if it has one. If it doesn't have an ID, then this value is an empty string (<code>""</code>). If the <code>TextTrack</code> is associated with a <a href="/en-US/docs/Web/HTML/Element/track" title="The HTML <track> element is used as a child of the media elements <audio> and <video>. It lets you specify timed text tracks (or time-based data), for example to automatically handle subtitles. The tracks are formatted in WebVTT format (.vtt files) — Web Video Text Tracks or&nbsp;Timed Text Markup Language (TTML)."><code>&lt;track&gt;</code></a> element, then the track's ID matches the element's ID.</div>
  </li>
  <li>
    <a href="">inBandMetadataTrackDispatchType</a>
    <div>Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> which indicates the track's in-band metadata track dispatch type. <em><strong>needs details</strong></em></div>
  </li>
  <li>
    <a href="">kind</a>
    <div>Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> indicating what kind of text track the <code>TextTrack</code> describes. The value must be one of those in the TextTrackKind enum.</div>
  </li>
  <li>
    <a href="">label</a>
    <div>A human-readable <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> which contains the text track's label, if one is present; otherwise, this is an empty string (<code>""</code>), in which case a custom label may need to be generated by your code using other attributes of the track, if the track's label needs to be exposed to the user.</div>
  </li>
  <li>
    <a href="">language</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> which specifies the text language in which the text track's contents is written. The value must adhere to the format specified in the <a class="external" href="https://tools.ietf.org/html/bcp47" rel="noopener">Tags for Identifying Languages</a> (<a class="external" href="https://tools.ietf.org/html/bcp47" rel="noopener">BCP 47</a>) document from the IETF, just like the HTML <code><a href="/en-US/docs/Web/HTML/Global_attributes#attr-lang">lang</a></code> attribute. For example, this can be <code>"en-US"</code> for United States English or <code>"pt-BR"</code> for Brazilian Portuguese.</div>
  </li>
  <li>
    <a href="">mode</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> specifying the track's current mode. Changing this property's value changes the track's current mode to match. Permitted values are listed under <a href="/en-US/docs/Web/API/TextTrack/mode#Text_track_mode_constants">Text track mode constants</a>. The default is <code>disabled</code>, unless the <a href="/en-US/docs/Web/HTML/Element/track" title="The HTML <track> element is used as a child of the media elements <audio> and <video>. It lets you specify timed text tracks (or time-based data), for example to automatically handle subtitles. The tracks are formatted in WebVTT format (.vtt files) — Web Video Text Tracks or&nbsp;Timed Text Markup Language (TTML)."><code>&lt;track&gt;</code></a> element's <code><a href="/en-US/docs/Web/HTML/Element/track#attr-default">default</a></code> Boolean attribute is specified, in which case the default mode is <code>started</code>.</div>
  </li>
  <li>
    <a href="">oncuechange</a>
    <div></div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">addCue()</a>
    <div>Adds a cue (specified as a <a href="/en-US/docs/Web/API/TextTrackCue" title="TextTrackCue is an abstract class which is used as the basis for the various derived cue types, such as VTTCue; you will instead work with those derived types."><code>TextTrackCue</code></a> object to the track's list of cues.</div>
  </li>
  <li>
    <a href="">removeCue()</a>
    <div>Removes a cue (specified as a <a href="/en-US/docs/Web/API/TextTrackCue" title="TextTrackCue is an abstract class which is used as the basis for the various derived cue types, such as VTTCue; you will instead work with those derived types."><code>TextTrackCue</code></a> object from the track's list of cues.</div>
  </li>
</ul>

## Events