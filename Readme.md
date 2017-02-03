# childsplay

source code for [childsplay](http://bemorechildish.surge.sh)

## development
the site uses metalsmith to make a static site

### setup
install node.js and npm and clone this repo. then

```
npm install
```

### dev environment
just run

```
node index.js
```

### deploy
this site is deployed to surge.sh. first time it will ask for
credentials. if wanna deploy to a diferent domain edit Gruntfile.js

```
grunt surge
```
