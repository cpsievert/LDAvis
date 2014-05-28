## R package for interactive topic model visualization using shiny & D3

### Demonstration

Click <a href='http://www.research.att.com/~kshirley/lda/index.html' target='_blank'>here</a> to see a demonstration of LDAvis on the AP data (2246 Associated Press documents).

### Installing the package

Currently there isn't a release on [CRAN](http://cran.r-project.org/).

If you are familiar with [devtools](http://cran.r-project.org/web/packages/devtools/index.html), you can install `LDAvis` with this line:

`devtools::install_github("cpsievert/LDAvis")`

Or you can decompress the zip ball or tar ball and run `R CMD INSTALL` on it or use `library(devtools); install("/path/to/package")`.

### Using the package

Once installed, load `library(LDAvis)`. See the help page `?runVis` for examples and details on how to create your own visualization.

### Explanation and documentation:

To read about the methodology behind LDAvis, please see <a href='http://nlp.stanford.edu/events/illvi2014/papers/sievert-illvi2014.pdf' target='_blank'>our paper</a>, which will be presented at the <a href='http://nlp.stanford.edu/events/illvi2014/' target='_blank'>2014 ACL Workshop on Interactive Language Learning, Visualization, and Interfaces</a> in Baltimore on June 27, 2014.
