\name{createJSON}
\alias{createJSON}
\title{Create the JSON object to read into the javascript visualization}
\usage{
  createJSON(K = integer(), phi = matrix(),
    term.frequency = integer(), vocab = character(),
    topic.proportion, n.terms = 30)
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
\value{
  an JSON object in R that can be written to a file to feed
  the interactive visualization
}
\description{
  This function creates the JSON object that feeds the
  javascript visualization that is currently stored in
  'path-to-LDAvis/LDAvis/inst/html/'
}
\examples{
# Example using Newsgroup documents from
# http://qwone.com/~jason/20Newsgroups/

data("Newsgroupdata", package = "LDAvis")

# Check the inputs and sort topics by frequency:
z <- check.inputs(K=50, W=22524, phi=Newsgroupdata$phi,
                  term.frequency=Newsgroupdata$term.frequency,
                  vocab=Newsgroupdata$vocab,
                  topic.proportion=Newsgroupdata$topic.proportion)

# Assign the elements of Newsgroupdata to global variables
# and note that the topics have been re-ordered
for (i in 1:length(z)) assign(names(z)[i], z[[i]])
colnames(phi) <- 1:K

# This function takes 1-2 minutes to set up the data:
json <- createJSON(K=K, phi=phi, term.frequency=term.frequency, vocab=vocab,
                   topic.proportion=topic.proportion, n.terms=30)

# Save the object to a .json file in the LDAvis/inst/html/ directory
cat(json, file="path-to-LDAvis/LDAvis/inst/html/lda.json")

# From 'path-to-LDAvis/LDAvis/inst/html/' serve the page locally
# by typing 'python -m SimpleHTTPServer' into the terminal
# and enter 'localhost:8000' into your browser
}

