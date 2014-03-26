#' Run shiny/D3 visualization
#' 
#' This function is a very small wrapper around \link{shiny::runApp}. Before calling this function, make sure
#' you have four objects named 'phi', 'token.frequency', 'vocab', and 'topic.proportion' exist in the global environment
#' and you also \link{check.inputs}.
#' 
#' @param ... Arguments passed to \link{shiny::runApp}.
#' @seealso \link{check.inputs}
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
#' data("Newsgroupdata", package = "LDAvis")
#' z <- check.inputs(K=50, W=22524, phi=Newsgroupdata$phi, token.frequency=Newsgroupdata$token.frequency,
#'                    vocab=Newsgroupdata$vocab, topic.proportion=Newsgroupdata$topic.proportion)
#' for (i in 1:length(z)) assign(names(z)[i], z[[i]])
#' 
#' # Set a seed to ensure k-means produces the same clusters everytime you runVis()
#' set.seed(333)
#' runVis()
#'

runVis <- function(...) {
  shinyDir <- system.file("shiny", package = "LDAvis")
  runApp(appDir = shinyDir, ...)
}
  