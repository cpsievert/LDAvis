#!/bin/bash

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
Rscript -e "devtools::install('../LDAvis'); a <- Sys.glob(file.path('*', '*.Rmd')); b <- sub('Rmd$', 'html', a); mapply(knitr::knit2html, a, b)"
git add .
git commit -m "deployed to github pages"

# push to gh-pages branch of cpsievert/LDAvis repo!!!
GH_REPO="@github.com/cpsievert/LDAvis.git"
FULL_REPO="https://$GH_TOKEN$GH_REPO"
git push --force --quiet $FULL_REPO master:gh-pages