#!/bin/bash

# where would I be without Yihui? https://github.com/yihui/xran/blob/gh-pages/r-xran
[ "${TRAVIS_PULL_REQUEST}" != "false" ] && exit 0

# remove the examples
rm -rf examples || exit 0;

# unzip the package
for files in '*.tar.gz'; do
        tar xfz $files
done

# copy over examples folder and start git repo
cp -r ../LDAvis/inst/examples/ .
cd examples
git init
git config user.name "cpsievert"
git config user.email "cpsievert1@gmail.com"

# compile demo html pages and commit
R -e "devtools::install('../LDAvis'); source('knit_examples.R')"
git add .
git commit -m "deployed to github pages"

# push to gh-pages branch of cpsievert/LDAvis repo!!!
GH_REPO="@github.com/cpsievert/LDAvis.git"
FULL_REPO="https://$GH_TOKEN$GH_REPO"
git push --force --quiet $FULL_REPO master:gh-pages
