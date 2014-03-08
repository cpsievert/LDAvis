\name{runVis}
\alias{runVis}
\title{Run shiny/D3 visualization}
\usage{
runVis(phi, freq, ...)
}
\arguments{
  \item{phi}{numeric matrix where \code{rownames} contain
  tokens \code{colnames} contain topic labels}

  \item{freq}{integer vector with number of times each
  token appears in the corpus. Note the ordering of the
  counts have to match the ordering of the rownames of the
  \code{phi} argument.}
}
\value{
Returns NULL, but will prompt browser to open a
visualization driven by the argument values.
}
\description{
Run shiny/D3 visualization
}
\examples{
# Example using AP documents from http://www.cs.princeton.edu/~blei/lda-c/ap.tgz
runVis()
}

