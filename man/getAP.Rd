\name{getAP}
\alias{getAP}
\title{Grab AP data from the topicmodels package and generate token occurences}
\usage{
getAP()
}
\description{
Grab AP data from the topicmodels package and generate
token occurences
}
\examples{
freqs <- getAP()
data("occurences", package = "LDAvis")
identical(occurences, freqs) #TRUE
}

