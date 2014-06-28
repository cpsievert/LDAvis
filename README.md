## LDAvis

R package for interactive topic model visualization.

### Installing the package

If you are familiar with <a href='http://cran.r-project.org/web/packages/devtools/index.html' target='_blank'>devtools</a>, it is easiest to install LDAvis this way:

`devtools::install_github("cpsievert/LDAvis")`

Alternatively, you can decompress the zip ball or tar ball and run `R CMD INSTALL` on it.

### Using the package

Once installed and loaded, there are two 'main' help pages that implement the two main approaches of LDAvis:

* `?runShiny`: demonstrates some <a href='http://shiny.rstudio.com/' target='_blank'>shiny</a>-based examples.

* `?createJSON`: demonstrates some static web page examples.

### LDAvis demos

* <a href='http://www2.research.att.com/~kshirley/lda/index.html' target='_blank'>Associated Press demo</a>: This webpage contains the raw html version of LDAvis, and shows a 40-topic model of news articles from the Associated Press.

* <a href='http://cpsievert.github.io/LDAvis/newsgroup/newsgroup.html' target='_blank'>Embed multiple visualizations into a static HTML page</a> via [knitr](https://github.com/yihui/knitr/) and [rmarkdown](https://github.com/rstudio/rmarkdown). See the [examples folder](https://github.com/cpsievert/LDAvis/tree/master/inst/examples) to see the source code.

* <a href='http://cpsievert.github.io/LDAvis/reviews/reviews.html' target='_blank'> Using mallet and LDAvis to model and visualize movie reviews. </a>


* <a href='http://ropensci.org/blog/2014/04/16/topic-modeling-in-R/' target='_blank'>Elife abstracts</a>: A blog post by Carson about fitting a topic model to abstract from the open-access journal eLife. The Shiny version of LDAvis is embedded into this webpage.



### Explanation and documentation:

To read about the methodology behind LDAvis, please see <a href='http://nlp.stanford.edu/events/illvi2014/papers/sievert-illvi2014.pdf' target='_blank'>our paper</a>, which will be presented at the <a href='http://nlp.stanford.edu/events/illvi2014/' target='_blank'>2014 ACL Workshop on Interactive Language Learning, Visualization, and Interfaces</a> in Baltimore on June 27, 2014.
