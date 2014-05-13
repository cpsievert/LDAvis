\name{check.inputs}
\alias{check.inputs}
\title{Check the coherence of the input objects, and sort terms and topics in
decreasing order of frequency}
\usage{
check.inputs(K = integer(), W = integer(), phi = matrix(),
  term.frequency = integer(), vocab = character(),
  topic.proportion = numeric())
}
\arguments{
  \item{K}{the number of topics in the model}

  \item{W}{the number of terms in the vocabulary}

  \item{phi}{a matrix with W rows, one for each term in the
  vocabulary, and K columns, one for each topic, where each
  column sums to one. Each column is the multinomial
  distribution over terms for a given topic in an LDA topic
  model.}

  \item{term.frequency}{an integer vector of length W
  containing the frequency of each term in the vocabulary.}

  \item{vocab}{a character vector of length W containing
  the unique terms in the corpus.}

  \item{topic.proportion}{a numeric vector of length K
  containing the proportion of each topic in the corpus.}
}
\value{
A list with the same six named components as the arguments
to the function, except sorted as described above.
}
\description{
This function performs a series of checks on the input
objects to make sure that they form a coherent set of
components of a topic model fit using LDA. The function
also sorts the vocabulary in decreasing order of term
frequency, and the topics in decreasing order of topic
proportion.
}
\details{
The columns of \code{phi} must be in the same order as
\code{topic.proportion}, and the rows of \code{phi} must be
in the same order as \code{term.frequency} and
\code{vocab}. The vector \code{topic.proportion} can be
computed as a function of (1) the estimated topic
distribution for each document in the corpus, and the
number of tokens in each document.
}
\examples{
# Example using AP documents from
# http://www.cs.princeton.edu/~blei/lda-c/ap.tgz
data("APdata", package = "LDAvis")
x <- check.inputs(K=40, W=10473, phi=APdata$phi,
                  term.frequency=APdata$term.frequency,
                  vocab=APdata$vocab, topic.proportion=APdata$topic.proportion)
}

