#!/bin/sh

# You'll need jsmin. Steps to get jsmin:
# $ wget https://raw.github.com/douglascrockford/JSMin/master/jsmin.c
# $ gcc -O3 jsmin.c
# $ sudo mv a.out /usr/bin/jsmin

echo "Bundling dependencies and minifying..."
cat dependencies/* dcgl.js > dcgl.bundle.js 
jsmin < dcgl.bundle.js > dcgl.bundle.min.js

echo "Building docs..."
markdown index.md > index.html

echo "Done!"
