# gulp-sprites
Convert a set of images into a spritesheet and CSS variables via gulp


## Install
```bash
npm install
```

## Basic Usage
```bash
gulp
```
- src/{service}/sprites/{folder}/*.png => dist/{service}/sprites/{folder}/sp_{folder}.png
- src/{service}/sprites/{folder}/*.png => dist/{service}/sprites/{folder}/sp_{folder}.scss

## Browser Testing
```bash
gulp serve
```

## Options
### Algorithms
```bash
gulp --lgorithm=binary-tree
```
- top-down
- left-right 
- diagonal
- alt-diagonal
- binary-tree(default)

### Padding
```bash
gulp --padding=10
```