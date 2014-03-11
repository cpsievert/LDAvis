\name{getAPfreq}
\alias{getAPfreq}
\title{Grab AP data from the topicmodels package and generate token occurences.}
\usage{
  getAPfreq()
}
\description{
  This function is silly and mainly for reproducibility
  purposes.
}
\examples{
freq <- getAPfreq()
data("APfreq", package = "LDAvis")
identical(APfreq, freq) #TRUE
}

