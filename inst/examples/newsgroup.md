---
title: "Newsgroup Data"
author: "Carson Sievert"
date: "May 28, 2014"
output: 
  html_document:
    self_contained: false
    theme: united
    highlight: tango
---

[LDAvis](https://github.com/cpsievert/LDAvis/) comes prepackaged with some data sets to help quickly demonstrate how to use it. This document visualizes a topic model fit to Newsgroup documents^[See http://qwone.com/~jason/20Newsgroups] created with **LDAvis** and **knitr** ([see here]() for source code). There are four essential components to this data structure:


```r
library(LDAvis)
data("Newsgroupdata", package = "LDAvis")
str(Newsgroupdata)
```

```
## List of 4
##  $ phi             : num [1:22524, 1:50] 6.28e-07 3.69e-02 6.28e-07 1.78e-02 3.89e-03 ...
##   ..- attr(*, "dimnames")=List of 2
##   .. ..$ : chr [1:22524] "#onedigitnumber" "#emailaddress" "#twodigitnumber" "not" ...
##   .. ..$ : chr [1:50] "1" "2" "3" "4" ...
##  $ term.frequency  : Named num [1:22524] 31750 27646 21708 18365 16294 ...
##   ..- attr(*, "names")= chr [1:22524] "#onedigitnumber" "#emailaddress" "#twodigitnumber" "not" ...
##  $ vocab           : chr [1:22524] "#onedigitnumber" "#emailaddress" "#twodigitnumber" "not" ...
##  $ topic.proportion: num [1:50] 0.00992 0.01287 0.06031 0.0195 0.01352 ...
```


The first element of this list - "phi" - is a matrix and is one of the main outputs from an [LDA topic model](http://en.wikipedia.org/wiki/Latent_Dirichlet_allocation). Each column of this $\phi$ matrix defines a probability mass function over terms for a given topic. Consequently, the columns of the $\phi$ matrix must sum to 1.


```r
with(Newsgroupdata, colSums(phi))
```

```
##  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 
##  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1 
## 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 
##  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1
```


In this case, we've included terms in the rownames of the $\phi$ matrix which also defines the vocabulary (i.e., the set of all terms). 


```r
all(with(Newsgroupdata, rownames(phi) == vocab))
```

```
## [1] TRUE
```


The `term.frequency` is simply the number of times each term appears in the entire corpus where `topic.proportion` contains the percentage of tokens that derive from each topic. **LDAvis** comes equipped with a `check.inputs` function which conducts some basic checks on each of these elements.


```r
# Check the inputs and sort topics by frequency:
z <- with(Newsgroupdata, check.inputs(K = 50, W = 22524, phi, term.frequency, 
    vocab, topic.proportion))
```

```
## Your inputs look good! Go ahead and runVis() or createJSON().
```


Most importantly, `check.inputs` will reorder columns of the $\phi$ matrix based on `topic.proportion` so that "first topic" represents the most frequent topic.


```r
with(Newsgroupdata, order(topic.proportion, decreasing = TRUE))
```

```
##  [1] 24 16  3 26 21 10  7 40 42 15 38 36 30 17  6 39 44 11  4 32 33 35 22
## [24] 49 12 31 20 41 27 50  5  2 28 13 23 43 29 46  1 47 25 18 48 45 37 19
## [47]  8  9 34 14
```

```r
with(z, colnames(phi))
```

```
##  [1] "24" "16" "3"  "26" "21" "10" "7"  "40" "42" "15" "38" "36" "30" "17"
## [15] "6"  "39" "44" "11" "4"  "32" "33" "35" "22" "49" "12" "31" "20" "41"
## [29] "27" "50" "5"  "2"  "28" "13" "23" "43" "29" "46" "1"  "47" "25" "18"
## [43] "48" "45" "37" "19" "8"  "9"  "34" "14"
```


For this reason, it's a good idea to relabel the column names of $\phi$


```r
colnames(z$phi) <- seq_len(z$K)
```


At this point, we have an option to create a [shiny](http://shiny.rstudio.com/) based visualization with `runVis` or we can `createJSON` to derive a JSON object that will feed a standalone webpage. Although the shiny based visualization has a few more controls, the standalone page allows us to browse relevant terms for different topics while preserving [object constancy](http://bost.ocks.org/mike/constancy/) (try clicking on one of the circles below then decreasing the value of $\lambda$). `createJSON` fosters this approach by recomputing the top 30 most relevant terms for each topic (over a grid of values for $\lambda$).^[See [here](http://nlp.stanford.edu/events/illvi2014/papers/sievert-illvi2014.pdf) for the definition and discussion of relevance.]


```r
json <- with(z, createJSON(K, phi, term.frequency, vocab, topic.proportion, 
    n.terms = 30, dist.measure = "JS"))
```


Now that we have `json`, we can use `serVis` function to spit out files required to view the interactive webpage. One can even use this function to upload files as [a gist](https://gist.github.com/cpsievert/70ca32cd3f4af8fe4cd4) which can then be viewed via [bl.ocks.org](http://bl.ocks.org/cpsievert/raw/70ca32cd3f4af8fe4cd4/).


```r
serVis(json, out.dir = "newsgroup", open.browser = FALSE)
```

```
## Warning: 'newsgroup' already exists
```


Now, to embed the resulting webpage [/newsgroup/index.html](/LDAvis/newsgroup/index.html) within this page, we can make use of the HTML `iframe` tag.

<iframe src = "newsgroup/index.html" width=1250 height=750></iframe>

The `createJSON` function also takes an argument allowing us to change how the distance between topics is measured. Notice how using symmetric Kullback-Leibler (as opposed to Jensen-Shannon) divergence alters the locations of points on the left-hand side of the visualization.


```r
# Takes 1-2 minutes to set up the data:
json2 <- with(z, createJSON(K, phi, term.frequency, vocab, topic.proportion, 
    n.terms = 30, dist.measure = "KL"))
```



```r
serVis(json2, out.dir = "newsgroup2", open.browser = FALSE)
```

```
## Warning: 'newsgroup2' already exists
```


<iframe src = "newsgroup2/index.html" width=1250 height=750></iframe>


