## LDAvis

R package for interactive topic model visualization.

LDAvis is designed to allow users to more easily interpret the topics in a topic model that has been fit to a corpus of text data. The package contains a single main function that takes basic information about an LDA topic model and returns a JSON object that feeds an interactive, web-based visualization that is designed to allow users to easily interpret the topics in their model.

### Installing the package

If you are familiar with [devtools](http://cran.r-project.org/web/packages/devtools/index.html), it is easiest to install LDAvis this way:

`devtools::install_github("cpsievert/LDAvis", build_vignettes = TRUE)`

Alternatively, you can decompress the zip ball or tar ball and run `R CMD INSTALL` on it.

### Getting started

Once installed, we recommend a visit to the main help page:

```
library(LDAvis)
help(createJSON, package = "LDAvis")
``` 

The documentation and example on the bottom of that page should provide a quick sense of how to create (and share) your own visualizations. If you want more details about the setup and it's connection to visual components, see the vignette:

```s
vignette("details", package = "LDAvis")
```

Note that **LDAvis** itself does not provide facilities for *fitting* the model (only *visualizing* a fitted model). If you want to perform LDA in R, there are several packages, including [mallet](http://cran.r-project.org/web/packages/mallet/index.html), [lda](http://cran.r-project.org/web/packages/lda/index.html), and [topicmodels](http://cran.r-project.org/web/packages/topicmodels/index.html).

For an example that demonstrate how to both perform LDA and *visualize* the result with **LDAvis**, see our short writeup here of a 20-topic model fit to 2,000 movie reviews using the R package [lda](http://cran.r-project.org/web/packages/lda/index.html), and visuzlized using **LDAvis**:

[Movie Reviews Topic Model](http://cpsievert.github.io/LDAvis/reviews/reviews.html)

We have also fit models using MALLET from the command line and read the necessary objects into R and visualized the model using LDAvis.

[Twenty Newsgroups Topic Model](http://cpsievert.github.io/LDAvis/newsgroup/vis)

### More documentation

To read about the methodology behind LDAvis, see [our paper](http://nlp.stanford.edu/events/illvi2014/papers/sievert-illvi2014.pdf), which we presented at the [2014 ACL Workshop on Interactive Language Learning, Visualization, and Interfaces](http://nlp.stanford.edu/events/illvi2014/) in Baltimore on June 27, 2014.
