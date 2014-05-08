#' Check the coherence of the input objects, and sort terms and topics in 
#' decreasing order of frequency
#'
#' This function performs a series of checks on the input objects to make sure 
#' that they form a coherent set of components of a topic model fit using LDA.
#' The function also sorts the vocabulary in decreasing order of term frequency,
#' and the topics in decreasing order of topic proportion.
#' 
#' @param K the number of topics in the model
#'
#' @param W the number of terms in the vocabulary
#'
#' @param phi a matrix with W rows, one for each term in the vocabulary, and K 
#' columns, one for each topic, where each column sums to one. Each column is the 
#' multinomial distribution over terms for a given topic in an LDA topic model.
#'
#' @param term.frequency an integer vector of length W containing the frequency 
#' of each term in the vocabulary.
#'
#' @param vocab a character vector of length W containing the unique terms in 
#' the corpus.
#'
#' @param topic.proportion a numeric vector of length K containing the proportion
#'  of each topic in the corpus.
#'
#' @details The columns of \code{phi} must be in the same order as 
#' \code{topic.proportion}, and the rows of \code{phi} must be in the same order 
#' as \code{term.frequency} and \code{vocab}. The vector \code{topic.proportion} 
#' can be computed as a function of (1) the estimated topic distribution for each
#' document in the corpus, and the number of tokens in each document.
#'
#' @return A list with the same six named components as the arguments to the 
#' function, except sorted as described above.
#'
#' @export
#' 
#' @examples
#' # Example using AP documents from 
#' # http://www.cs.princeton.edu/~blei/lda-c/ap.tgz
#' data("APdata", package = "LDAvis")
#' x <- check.inputs(K=40, W=10473, phi=APdata$phi, 
#'                   term.frequency=APdata$term.frequency,
#'                   vocab=APdata$vocab, topic.proportion=APdata$topic.proportion)
#' 

check.inputs <- function(K=integer(), W=integer(), phi=matrix(), 
                         term.frequency=integer(),
                         vocab=character(), topic.proportion=numeric()) {

  # Start checking the dimension of each object:
  stopifnot(K == dim(phi)[2])
  stopifnot(W == dim(phi)[1])
  stopifnot(W == length(term.frequency))
  stopifnot(W == length(vocab))
  stopifnot(K == length(topic.proportion))
  message("Your inputs look good! Go ahead and runVis() or createJSON().")

  # order rows of phi, term.frequency, and vocabulary in decreasing order of 
  # term.frequency:
  term.order <- order(term.frequency, decreasing=TRUE)
  phi <- phi[term.order, ]
  term.frequency <- term.frequency[term.order]
  vocab <- vocab[term.order]

  # order columns of phi and topic.proportion in decreasing order of 
  # topic proportion:
  topic.order <- order(topic.proportion, decreasing=TRUE)
  phi <- phi[, topic.order]
  topic.proportion <- topic.proportion[topic.order]

  # return a list with the same named elements as the inputs to this function, 
  # except re-ordered as necessary:
  return(list(K=K, W=W, phi=phi, term.frequency=term.frequency, 
              vocab=vocab, topic.proportion=topic.proportion))
}
