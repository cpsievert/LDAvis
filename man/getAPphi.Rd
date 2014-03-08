\name{getAPphi}
\alias{getAPphi}
\title{Grab phi matrix for AP data}
\usage{
getAPphi()
}
\description{
This function is silly and mainly for reproducibility
purposes.
}
\examples{
phi <- getAPphi()
data("APphi", package = "LDAvis")
identical(APphi, phi) #TRUE
}

