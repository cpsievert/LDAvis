## LDAvis

[![Build Status](https://travis-ci.org/cpsievert/LDAvis.png?branch=master)](https://travis-ci.org/cpsievert/LDAvis)

R package for interactive topic model visualization.

![LDAvis icon](http://www.kennyshirley.com/figures/ldavis-pic.png)

**LDAvis** is designed to help users interpret the topics in a topic model that has been fit to a corpus of text data. The package extracts information from a fitted LDA topic model to inform an interactive web-based visualization.

### Installing the package

* Stable version on CRAN:

```r
install.packages("LDAvis")
```

* Development version on GitHub (with [devtools](https://cran.r-project.org/package=devtools)):

```r
devtools::install_github("cpsievert/LDAvis")
```

### Getting started

Once installed, we recommend a visit to the main help page:

```r
library(LDAvis)
help(createJSON, package = "LDAvis")
```

The documentation and example on the bottom of that page should provide a quick sense of how to create (and share) your own visualizations. If you want more details about the technical specifications of the visualization, see the vignette:

```r
vignette("details", package = "LDAvis")
```

Note that **LDAvis** itself does not provide facilities for *fitting* the model (only *visualizing* a fitted model). If you want to perform LDA in R, there are several packages, including [mallet](https://cran.r-project.org/package=mallet), [lda](https://cran.r-project.org/package=lda), and [topicmodels](https://cran.r-project.org/package=topicmodels).

If you want to perform LDA with the R package **lda** and visualize the result with **LDAvis**, our example of a [20-topic model fit to 2,000 movie reviews](https://ldavis.cpsievert.me/reviews/reviews.html) may be helpful.

**LDAvis** does not limit you to topic modeling facilities in R. If you use other tools ([MALLET](http://mallet.cs.umass.edu/) and [gensim](https://radimrehurek.com/gensim/) are popular), we recommend that you visit our [Twenty Newsgroups](https://ldavis.cpsievert.me/newsgroup/newsgroup.html) example to help quickly understand what components **LDAvis** will need.

### Sharing a Visualization

To share a visualization that you created using **LDAvis**, you can encode the state of the visualization into the URL by appending a string of the form:

"#topic=k&lambda=l&term=s"

to the end of the URL, where "k", "l", and "s" are strings indicating the desired values of the selected topic, the value of lambda, and the selected term, respectively. For more details, see the last section of our [Movie Reviews example](https://ldavis.cpsievert.me/reviews/reviews.html), or for a quick example, see the link here:

<https://ldavis.cpsievert.me/reviews/vis/#topic=3&lambda=0.6&term=cop>

### Video demos

* [Visualizing & Exploring the Twenty Newsgroup Data](http://stat-graphics.org/movies/ldavis.html)
* [Visualizing Topic Models demo with Hacker News Corpus](https://www.youtube.com/watch?v=tGxW2BzC_DU)
  * [Notebook w/Visualization](http://nbviewer.ipython.org/github/bmabey/hacker_news_topic_modelling/blob/master/HN%20Topic%20Model%20Talk.ipynb)
  * [Slide deck](https://speakerdeck.com/bmabey/visualizing-topic-models)

### More documentation

To read about the methodology behind LDAvis, see [our paper](http://nlp.stanford.edu/events/illvi2014/papers/sievert-illvi2014.pdf), which we presented at the [2014 ACL Workshop on Interactive Language Learning, Visualization, and Interfaces](http://nlp.stanford.edu/events/illvi2014/) in Baltimore on June 27, 2014.

### Additional data

We included one data set in LDAvis, 'TwentyNewsgroups', which consists of a list with 5 elements:
- phi, a matrix with the topic-term distributions
- theta, a matrix with the document-topic distributions
- doc.length, a numeric vector with token counts for each document
- vocab, a character vector containing the terms
- term.frequency, a numeric vector of observed term frequencies

We also created a second data-only package called [LDAvisData](https://github.com/cpsievert/LDAvisData) to hold additional example data sets. Currently there are three more examples available there:
- Movie Reviews (a 20-topic model fit to 2,000 movie reviews)
- AP (a 40-topic model fit to approximately 2,246 news articles)
- Jeopardy (a 100-topic model fit to approximately 20,000 Jeopardy questions)
