#!/bin/bash

rm -rf out || exit 0;

GH_REPO="@github.com/cpsievert/LDAvis.git"

FULL_REPO="https://$GH_TOKEN$GH_REPO"

for files in '*.tar.gz'; do
        tar xfz $files
done

Rscript -e "setwd('LDAvis/inst/examples'); for (i in list.files()) knitr::knit2html(paste0(i, '/', i, '.Rmd')"
cp -r ../LDAvis/inst/examples/ .

cd examples
git init
git config user.name "cpsievert"
git config user.email "cpsievert1@gmail.com"

git add .
git commit -m "deployed to github pages"
git push --force --quiet $FULL_REPO master:gh-pages