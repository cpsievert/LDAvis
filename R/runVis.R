#' Run shiny/D3 visualization
#' 
#' The function assumes two objects named 'phi' and 'freq' exist in the global environment. The phi matrix have
#' tokens as rownames and topics as colnames. The rows should be sorted in decreasing order based on overall frequency
#' see \link{sortPhi}. 'freq' should be an integer vector with number of times each token appears in the corpus.
#' Note the ordering of the counts have to match the ordering of the rownames of phi.
#' 
#' @param ... Arguments passed to \code{shiny::runApp}.
#' @return Returns NULL, but will prompt browser to open a visualization based on the current value of 'phi' and 'freq'.
#' @importFrom shiny runApp
#' @export
#' @examples
#' 
#' # Example using AP documents from http://www.cs.princeton.edu/~blei/lda-c/ap.tgz
#' data("APdata", package = "LDAvis")
#' 
#' # Check the coherence of the input data using the function 'check.inputs()'
#' z <- check.inputs(K=40, W=10473, phi=APdata$phi, token.frequency=APdata$token.frequency,
#'                  vocab=APdata$vocab, topic.proportion=APdata$topic.proportion)
#'                  
#' # Assign the six elements of z as variables in the global environment and remove their list versions:
#' for (i in 1:length(z)) assign(names(z)[i], z[[i]])
#' 
#' # Now run the visualization app
#' runVis()
#' 
#' # Example using Newsgroup documents from http://qwone.com/~jason/20Newsgroups/
#' 
#' data("Newsgroupdata", package = "LDAvis")
#' z <- check.inputs(K=50, W=22524, phi=Newsgroupdata$phi, token.frequency=Newsgroupdata$token.frequency,
#'                    vocab=Newsgroupdata$vocab, topic.proportion=Newsgroupdata$topic.proportion)
#' for (i in 1:length(z)) assign(names(z)[i], z[[i]])
#' runVis()
#'

runVis <- function(...) {
  shinyDir <- system.file("shiny", package = "LDAvis")
  runApp(appDir = shinyDir, ...)
}
  