## LDAvis

R package for interactive topic model visualization.

### Installing the package

If you are familiar with [devtools](http://cran.r-project.org/web/packages/devtools/index.html), it is easiest to install LDAvis this way:

`devtools::install_github("cpsievert/LDAvis")`

Alternatively, you can decompress the zip ball or tar ball and run `R CMD INSTALL` on it.

### Using the package

Once installed and loaded, there are two 'main' help pages that implement the two main approaches of LDAvis:

* `?runVis`: demonstrates some [shiny](http://shiny.rstudio.com/)-based examples.

* `?createJSON`: demonstrates some [static web page](http://en.wikipedia.org/wiki/Static_web_page) examples.

### LDAvis demos

* <a href='http://www2.research.att.com/~kshirley/lda/index.html' target='_blank'>Associated Press demo</a>: This webpage contains the raw html version of LDAvis, and shows a 40-topic model of news articles from the Associated Press.

* [Elife abstracts](http://ropensci.org/blog/2014/04/16/topic-modeling-in-R/).

* [Embed multiple visualizations into a static HTML page](http://cpsievert.github.io/LDAvis/newsgroup/newsgroup.html) via [knitr](https://github.com/yihui/knitr/) and [rmarkdown](https://github.com/rstudio/rmarkdown). See the [examples folder](https://github.com/cpsievert/LDAvis/tree/master/inst/examples) to see the source code.


### Explanation and documentation:

To read about the methodology behind LDAvis, please see [our paper](http://nlp.stanford.edu/events/illvi2014/papers/sievert-illvi2014.pdf), which will be presented at the [2014 ACL Workshop on Interactive Language Learning, Visualization, and Interfaces](http://nlp.stanford.edu/events/illvi2014/) in Baltimore on June 27, 2014.
