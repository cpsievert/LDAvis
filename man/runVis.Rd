\name{runVis}
\alias{runVis}
\title{Run shiny/D3 visualization}
\usage{
  runVis(...)
}
\arguments{
  \item{...}{Arguments passed to \code{shiny::runApp}.}
}
\value{
  Returns NULL, but will prompt browser to open a
  visualization based on the current value of 'phi' and
  'freq'.
}
\description{
  The function assumes two objects named 'phi' and 'freq'
  exist in the global environment. The phi matrix have
  tokens as rownames and topics as colnames. The rows
  should be sorted in decreasing order based on overall
  frequency see \link{sortPhi}. 'freq' should be an integer
  vector with number of times each token appears in the
  corpus. Note the ordering of the counts have to match the
  ordering of the rownames of phi.
}
\examples{
# Example using AP documents from http://www.cs.princeton.edu/~blei/lda-c/ap.tgz
data("APphi", package = "LDAvis")
phi <- APphi
data("APfreq", package = "LDAvis")
freq <- APfreq
runVis()
}

