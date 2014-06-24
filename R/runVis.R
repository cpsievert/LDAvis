#' Run shiny/D3 visualization
#' 
#' This function was deprecated and replaced by \link{runShiny}
#' 
#' @param ... Arguments passed to shiny::runApp.
#' @seealso \link{check.inputs}
#' @export
#'

runVis <- function(...) {
  message("runVis is deprecated. Please see ?runShiny or ?createJSON.")
  return(NULL)
}
  