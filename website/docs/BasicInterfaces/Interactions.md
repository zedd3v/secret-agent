# Interactions

Every User in a BrowserInstance has a `interact()` method, which allow you to control the user's mouse and keyboard. `Interactions` are simple key/value objects you pass into this method:

```js
user.interact({ move: [100, 356] });
```

Multiple Interactions can be passed through as multiple arguments:

```js
user.interact({ click: [250, 356] }, { type: 'hello world' });
```

The timing of Interactions are controlled by an emulation layer, called [Huminoids](../advanced-functionality/humanoids), which generate realistic-looking, human-like movements on the remote webpage.

Interaction Commands fall into three broad categories:

- Mouse Commands
- Keyboard Commands
- WaitFor Commands

## The Five Mouse Commands

- move `MousePosition` Move cursor to the desired position.
- click `MousePosition` Press and release the mouse button as a single click.
- clickDown `MousePosition` Press the mouse button.
- clickUp `MousePosition` Release the mouse button.
- doubleclick `MousePosition` Press and release the mouse button twice in rapid succession.

#### **MousePosition**:
Every mouse command include a `MousePosition` value, which specifies where the interaction takes place. It accepts three possible options:
- `[x, y]` These are pixels relative to the top-left corner of the viewport.
- `SuperElement` Any element from the AwaitedDOM, which are translated into x/y coordinates.
- `null` Leave the mouse in its current position.

For example, here's how to hover over a link:

```js
const aElem = browser.document.querySelector('a.more-information');
user.interact({ move: aElem });
`````

Or double-click on a specific x/y coordinate:
```js
user.interact({ doubleclick: [50, 150] });
`````

#### **Dictating Left, Middle or Right**:
All button commands (click, doubleclick, etc) operate on the `Left` button by default. However, you can affix any of these commands with `Left`, `Middle` or `Right` to specify a specific button. For example:

```js
user.interact({ clickRight: [55, 42] });
````

## The Four Keyboard Commands

- keyPress: `KeyboardChar`
- keyDown: `KeyboardChar`
- keyUp: `KeyboardChar`
- type: `(string | KeyboardChar)[]`

Import KeyboardKeys from IKeyboardLayoutUS for all valid KeyboardChar values (e.g. `KeyboardKeys['\n']`, `KeyboardKeys.Enter`).

## The Three WaitFor Commands

- waitForNode: `SuperNode`
- waitForElementVisible: `SuperElement`
- waitForMillis: `number`

Read [this StackOverflow discussion](https://stackoverflow.com/questions/9979172/difference-between-node-object-and-element-object) on the difference between Nodes and Elements.

## Using Shortcuts

If you have no need to change the position of the mouse between commands (or other complexities, such as `waitFor`), you can create Interactions using simple `Command` strings.

For example, follow up a move command with click:

```js
user.interact({ move: [55, 42] }, 'click');
````

## Combining Commands

A single Interaction can include multiple commands. Multiple commands within a single Interaction are executed in rapid succession by the Humanoid.

Interactions are similar to paragraphs. The Humanoid adds a longer pause between Interactions then it does between commands within a single Interaction.

For example, this allows you to implement simple drag and drop interactions:

```js
user.interact({ clickDown: [55, 42], move: [155, 142] }, 'clickUp');
````

When multiple commands are combined within a single Interaction, their execution takes the following order:

1. waitForNode
2. waitForElementVisible
3. waitForMillis
4. click
5. doubleclick
6. clickDown
7. move
8. clickUp
9. keyPress
10. keyDown
11. type
12. keyUp

Note: Although commands within a single Interaction are sometimes executed at "nearly" the same time, it is never at the same precise moment. Their execution always follows the order listed above.

## When You Shouldn't Combine Commands
It's important to understand that combining multiple commands into a single Interaction usually produces different effects than splitting across multiple Interactions.

For example, there is a subtle but important difference between the following three code blocks:

<label>
  Example #1
</label>

```js
user.interact({ clickDown: [55, 42] });
````

<label>
  Example #2
</label>

```js
user.interact({ move: [55, 42], clickDown: [5, 5] });
````

<label>
  Example #2
</label>

```js
user.interact({ move: [55, 42] }, { clickDown: [5, 5] });
````

The first example moves the cursor to 55x42 before pressing the mouse down.

The second example does the opposite. It presses the mouse down at 5x5 before moving the cursor to 55x42 (see Combining Commands section above).

The third command moves the mouse to 55x42, pauses, then moves the mouse to 5x5 before clicking down.

## Conflicting Commands Will Throw Errors

An error will be thrown if you send commands that conflict with each other.

For example, the following example blows up when doubleclick is called while the mouse is still down:

```js
user.interact({ clickDown: [55, 42] }, { doubleclick: [5, 5] });
````

You can fix this by releasing the down:

```js
user.interact({ clickDown: [55, 42] }, 'up', { doubleclick: [5, 5] });
````
