## LDAvis

R package for interactive topic model visualization.

### Installing the package

If you are familiar with <a href='http://cran.r-project.org/web/packages/devtools/index.html' target='_blank'>devtools</a>, it is easiest to install LDAvis this way:

`devtools::install_github("cpsievert/LDAvis", build_vignettes = TRUE)`

Alternatively, you can decompress the zip ball or tar ball and run `R CMD INSTALL` on it.

### Getting started

Once installed, we recommend visiting the main help page:

```s
library(LDAvis)
help(createJSON)
``` 

The documentation and example on the bottom of that page should provide a quick sense of how to create your own visualizations. If you want more details about the setup and it's connection to the visual components, see the vignette:

```s
vignette("details", package = "LDAvis")
```

Note that **LDAvis** itself does not provide facilities for *fitting* the model (only *visualizing* a fitted model). If you want to perform LDA in R, there are several packages: <a href="http://cran.r-project.org/web/packages/mallet/index.html" target="_blank">mallet</a>, <a href="http://cran.r-project.org/web/packages/lda/index.html" target="_blank">lda</a>, <a href="http://cran.r-project.org/web/packages/topicmodels/index.html" target="_blank">topicmodels</a>, etc.

We have a few examples that demonstrate how to both perform LDA and *visualize* the result with LDAvis.
  1. <a href='http://cpsievert.github.io/LDAvis/reviews/reviews.html' target='_blank'> Movie reviews (uses mallet) </a>
  2. More to come...

Users also have the option to make inputs to `createJSON` dynamic via shiny and rmarkdown. Example coming soon...

### More documentation

To read about the methodology behind LDAvis, see: <a href='http://nlp.stanford.edu/events/illvi2014/papers/sievert-illvi2014.pdf' target='_blank'>our paper</a>, which will be presented at the <a href='http://nlp.stanford.edu/events/illvi2014/' target='_blank'>2014 ACL Workshop on Interactive Language Learning, Visualization, and Interfaces</a> in Baltimore on June 27, 2014.
