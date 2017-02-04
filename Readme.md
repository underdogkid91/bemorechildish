# childsplay

source code for [childsplay](http://bemorechildish.surge.sh)

table of contents
- [development](#development)
- [viz editor](#viz-editor)


---

## development
the site uses metalsmith to make a static site

**setup**

install node.js and npm and clone this repo. then

```
npm install
```

**dev environment**

just run

```
node index.js
```

**deploy**

this site is deployed to surge.sh. first time it will ask for
credentials. if wanna deploy to a diferent domain edit Gruntfile.js

```
grunt surge
```

---


## viz editor
visualizations can be created with the [editor](http://bemorechildish.surge.sh/𝔩𝔞𝔰𝔞𝔤𝔫𝔞/)

user guide:

**general**
- load a lasagna file by dropping it from your computer
- [TODO] clear the whole canvas by pressing the key c
- download/save the current file by pressing the key s

**layers**
- add a layer by dropping it from your computer
- move a layer by dragging it around the canvas
- remove a layers by clicking it and pressing the key d
- [TODO] move a layer forward by clicking it and pressing the key f
- [TODO] move a layer backwards by clicking it and pressing the key b
- make a layer the background layer by clicking it and
pressing the key b. click the background layer and press the
key b to unset it as the background layer.

**audio**
- add a soundcloud track by copying it (cmd + c) and pasting it
while the editor is open (cmd + v)

**effects**
- open the effects window by clicking a layer and then
pressing the key enter
- close the effect window by pressing the key esc
