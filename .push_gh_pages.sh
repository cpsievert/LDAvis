#!/bin/bash

rm -rf out || exit 0;
mkdir out;

GH_REPO="@github.com/cpsievert/LDAvis.git"

FULL_REPO="https://$GH_TOKEN$GH_REPO"

for files in '*.tar.gz'; do
        tar xfz $files
done

Rscript -e "setwd(\"LDAvis/inst/examples\"); knitr::knit2html(\"reviews.Rmd\")"

cd out
git init
git config user.name "cpsievert"
git config user.email "cpsievert1@gmail.com"
cp -r ../LDAvis/inst/examples/ .

git add .
git commit -m "deployed to github pages"
git push --force --quiet $FULL_REPO master:gh-pages