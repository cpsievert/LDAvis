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


#' Grab phi matrix for AP data
#' 
#' This function is silly and mainly for reproducibility purposes.
#' 
#' @examples
#' phi <- getAPphi()
#' data("APphi", package = "LDAvis")
#' identical(APphi, phi) #TRUE
#' 

getAPphi <- function() {
  #Data files other than .rda should be put in the extdata folder -- http://stackoverflow.com/questions/13463103/inst-and-extdata-folders-in-r-packaging
  phi.file <- paste(system.file("inst", "extdata", package = "LDAvis"), "APphi.txt", sep = "/")
  phi <- read.table(phi.file, header = TRUE, sep = "\t")
  #sanity check
  data("APfreq", package = "LDAvis")
  all(names(APfreq) == rownames(phi))
  return(phi)
}