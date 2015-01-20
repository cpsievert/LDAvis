## Test environments
* local OS X install, R 3.1.2
* win-builder (devel and release)

## R CMD check results
There were no ERRORs or WARNINGs.

There was 1 NOTE:

* checking installed package
  size ... NOTE
  installed size is  5.6Mb

  sub-directories of 1Mb or more:
    data
  5.1Mb

The files in data/ are output from LDA
  models applied to several popular data-sets in the
  text mining community. We use this output to teach
  users how to go from their fitted model to a
  corresponding visualization created with LDAvis as
  well as to provide interesting
  examples.

http://cpsievert.github.io/LDAvis/newsgroup/newsgroup.html
http://cpsievert.github.io/LDAvis/reviews/reviews.html
http://cpsievert.github.io/LDAvis/Jeopardy/vis
http://cpsievert.github.io/LDAvis/AP/vis
