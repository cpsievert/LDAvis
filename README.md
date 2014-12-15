## LDAvis

R package for interactive topic model visualization.

**LDAvis** is designed to allow users to more easily interpret the topics in a topic model that has been fit to a corpus of text data. The package extracts information from a fitted LDA topic model to inform an interactive web-based visualization.

### Installing the package

If you are familiar with [devtools](http://cran.r-project.org/web/packages/devtools/index.html), it is easiest to install **LDAvis** this way:

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

If you want to perform LDA with the R package **lda** and *visualize* the result with **LDAvis**, our example of a [20-topic model fit to 2,000 movie reviews](http://cpsievert.github.io/LDAvis/reviews/reviews.html) may be helpful.

**LDAvis** does not limit you to topic modeling facilities in R. If you use other tools ([MALLET](http://mallet.cs.umass.edu/) and [gensim](https://radimrehurek.com/gensim/) are popular), we recommend that you visit our [Twenty Newsgroups](http://cpsievert.github.io/LDAvis/newsgroup/newsgroup.html) example to help quickly understand what components **LDAvis** will need.

### More documentation

To read about the methodology behind LDAvis, see [our paper](http://nlp.stanford.edu/events/illvi2014/papers/sievert-illvi2014.pdf), which we presented at the [2014 ACL Workshop on Interactive Language Learning, Visualization, and Interfaces](http://nlp.stanford.edu/events/illvi2014/) in Baltimore on June 27, 2014.
