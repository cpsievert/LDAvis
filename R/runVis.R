#' Sort phi before uploading to runVis()
#'
#' @param phi numeric matrix where column names are tokens and rownames are topic labels
#' @return A matrix with number of columns equal to the vocabulary and number of rows equal to the number of topics
#' @export
#'

sortPhi <- function(phi, ...) {
  NULL
}


#' Run shiny/D3 visualization
#'
#' @param phi numeric matrix where \code{rownames} contain tokens \code{colnames} contain topic labels
#' @param freq integer vector with number of times each token appears in the corpus. 
#' Note the ordering of the counts have to match the ordering of the rownames of the \code{phi} argument.
#' @return Returns NULL, but will prompt browser to open a visualization driven by the argument values.
#' @importFrom shiny runApp
#' @export
#' @examples
#' 
#' # Example using AP documents from http://www.cs.princeton.edu/~blei/lda-c/ap.tgz
#' runVis()
#' 
#'

runVis <- function(phi, freq, ...) {
  if (missing(phi)) {
    message("No phi matrix detected. Serving up an example instead.")
    data("APphi", package = "LDAvis")
    phi <<- APphi
    data("APfreq", package = "LDAvis")
    vocab <<- names(APfreq)
    freq <<- as.integer(APfreq)
  } else if (missing(vocab) || missing(freq)) {
    stop("Both the vocab and freq arguments are required.")
  }
  # Obtain directory to the files required for the app
  visDir <- system.file("inst", "shiny", package = "LDAvis")
  runApp(appDir = visDir)
}


