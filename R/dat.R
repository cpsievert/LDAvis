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
