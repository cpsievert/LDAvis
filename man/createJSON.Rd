\name{createJSON}
\alias{createJSON}
\title{Create the JSON object to read into the javascript visualization}
\usage{
createJSON(K = integer(), phi = matrix(), term.frequency = integer(),
  vocab = character(), topic.proportion, n.terms = 30)
}
\arguments{
  \item{K}{integer, number of topics in the fitted LDA
  model}

  \item{phi}{matrix, term-topic distributions, where there
  are as many rows as terms in the vocabulary, and K
  columns, one per topic.}

  \item{term.frequency}{numeric, the frequency of each term
  in the vocabulary, which can contain non-integer values
  as a result of smoothing via priors.}

  \item{vocab}{character vector of the terms in the
  vocabulary (in the same order as the rows of \code{phi})}

  \item{topic.proportion}{numeric, the proportion of tokens
  generated from each topic across the corpus, with length
  equal to K.}

  \item{n.terms}{integer, the number of terms to display in
  the barcharts of the interactive viz. Default is 30.
  Recommended to be between 10 and 50.}
}
\description{
This function creates the JSON object that feeds the
javascript visualization
}
\examples{
# Example using AP documents from
# http://www.cs.princeton.edu/~blei/lda-c/ap.tgz
}

