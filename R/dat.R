#' Grab AP data from the topicmodels package and generate token occurences.
#' 
#' This function is silly and mainly for reproducibility purposes.
#' 
#' @examples
#' freq <- getAPfreq()
#' data("APfreq", package = "LDAvis")
#' identical(APfreq, freq) #TRUE
#' 

getAPfreq <- function() {
  if (!require(topicmodels)) stop("Please install the topicmodels package.")
  library(topicmodels)
  data("AssociatedPress")
  #docs <- AssociatedPress$i
  #doc.id <- rep(docs, AssociatedPress$v)
  words <- AssociatedPress$j
  word.id <- rep(words, AssociatedPress$v)
  vocab <- AssociatedPress$dimnames$Terms
  tokens <- vocab[word.id]
  return(table(tokens))
}

#' Create phi matrix for AP data
#' 

createAPphi <- function() {
  # Should I bother with this Kenny?
  # I have some code used to create phi we currently use from LDAviz::fitLDA. Should I include it?
  NULL
}


#' Check the coherence of the input objects, and sort tokens and topics in decreasing order of frequency
#'
#' This function performs a series of checks on the input objects to make sure that they
#' form a coherent set of components of a topic model fit using LDA. The function also 
#' sorts the vocabulary in decreasing order of token frequency, and the topics in decreasing
#' order of topic proportion.
#' 
#' @param K the number of topics in the model
#' @param W the number of tokens in the vocabulary
#' @param phi a matrix with W rows, one for each token in the vocabulary, and K columns, one for each topic,
#' where each column sums to one. Each column is the multinomial distribution over tokens for a given topic in
#' an LDA topic model.
#' @param token.frequency an integer vector of length W containing the frequency of each token in the
#' vocabulary.
#' @param vocab a character vector of length W containing the unique tokens in the corpus.
#' @param topic.proportion a numeric vector of length K containing the proportion of each topic in
#' the corpus.
#'
#' @details The columns of \code{phi} must be in the same order as \code{topic.proportion}, and the rows
#' of \code{phi} must be in the same order as \code{token.frequency} and \code{vocab}. The vector
#' \code{topic.proportion} can be computed as a function of (1) the estimated topic distribution for each
#' document in the corpus, and the number of tokens in each document. 
#' For details, see Sievert and Shirley (2014).
#'
#' @return A list with the same six named components as the arguments to the function, 
#' except sorted as described above.
#'
#' @export
#' 
#' @examples
#' # Example using AP documents from http://www.cs.princeton.edu/~blei/lda-c/ap.tgz
#' data("APdata", package = "LDAvis")
#' x <- check.inputs(K=40, W=10473, phi=APdata$phi, token.frequency=APdata$token.frequency,
#'                   vocab=APdata$vocab, topic.proportion=APdata$topic.proportion)
#' 

check.inputs <- function(K=integer(), W=integer(), phi=matrix(), token.frequency=integer(),
                         vocab=character(), topic.proportion=numeric()) {
  # Start checking the dimension of each object:
  stopifnot(K == dim(phi)[2])
  stopifnot(W == dim(phi)[1])
  stopifnot(W == length(token.frequency))
  stopifnot(W == length(vocab))
  stopifnot(K == length(topic.proportion))

  # order rows of phi, token.frequency, and vocabulary in decreasing order of token.frequency:
  token.order <- order(token.frequency, decreasing=TRUE)
  phi <- phi[token.order, ]
  token.frequency <- token.frequency[token.order]
  vocab <- vocab[token.order]

  # order columns of phi and topic.proportion in decreasing order of topic proportion:
  topic.order <- order(topic.proportion, decreasing=TRUE)
  phi <- phi[, topic.order]
  topic.proportion <- topic.proportion[topic.order]

  # return a list with the same named elements as the inputs to this function, except re-ordered as necessary:
  return(list(K=K, W=W, phi=phi, token.frequency=token.frequency, 
              vocab=vocab, topic.proportion=topic.proportion))
}
