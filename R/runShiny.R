#' Run shiny/D3 visualization
#' 
#' This function is deprecated as of version 0.2
#' 
#' @param phi a matrix with W rows, one for each term in the vocabulary, and K 
#' columns, one for each topic, where each column sums to one. Each column is the 
#' multinomial distribution over terms for a given topic in an LDA topic model.
#' @param term.frequency an integer vector of length W containing the frequency 
#' of each term in the vocabulary.
#' @param vocab a character vector of length W containing the unique terms in 
#' the corpus.
#' @param topic.proportion a numeric vector of length K containing the proportion
#'  of each topic in the corpus.
#' @export
#'

runShiny <- function(phi, term.frequency, vocab, topic.proportion) {
  message("`runShiny` is deprecated as of version 0.2, please use `createJSON`")
  return(NULL)
}
