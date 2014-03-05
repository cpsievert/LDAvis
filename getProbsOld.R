#' @title Compute topic-word and document-topic probability distribution matrices, and re-label topic indices
#'
#' @description This function assumes the ordering of \code{word.id}, \code{doc.id}, \code{topic.id} matters! 
#' That is, the first element of \code{word.id} corresponds to the first element of \code{doc.id} which corresponds to the first 
#' element of \code{topic.id}. Similarly, the second element of tokens corresponds to the second element of \code{doc.id} 
#' which corresponds to the second element of \code{topic.id} (and so on). Also, the ordering of the elements of \code{vocab}
#' are assumed to correspond to the elements of \code{word.id}, so that the first element of \code{vocab} is the token with \code{word.id}
#' equal to 1, the second element of \code{vocab} is the token with \code{word.id} equal to 2, etc.
#'
#' @param word.id a numeric vector with the token id of each token occurrence in the data.
#' @param doc.id a numeric vector containing the document id number of each token occurrence in the data.
#' @param topic.id a numeric vector with a unique value for each topic.
#' @param vocab a character vector of the unique words included in the corpus. The length of this vector should match the max value of \code{word.id}.
#' @param alpha Dirichlet hyperparameter. See \link{fitLDA}.
#' @param beta Dirichlet hyperparameter. See \link{fitLDA}.
#' @param sort.topics Sorting criterion for topics. Supported methods include: "byDocs" to sort topics by the 
#' number of documents for which they are the most probable or "byTerms" to sort topics by the number of terms within topic.
#' @param sort.terms Sorting criterion for terms. Supported methods include: "freq" for term frequency (in the corpus), 
#' "distinct" for distinctiveness as defined by Chuang, Manning and Heer (2012), "saliency" for p(word)*distinctiveness.
#' 
#' @return A list of two matrices and one vector. The first matrix is, \code{phi.hat}, contains the distribution over tokens for each topic,
#' where the rows correspond to topics. The second matrix, \code{theta.hat}, contains the distribution over topics for each document, where
#' the rows correspond to documents. The vector returned by the function, \code{topic.id}, is the vector of sampled topics from the LDA fit, 
#' with topic indices re-labeled in decreasing order of frequency by the \code{sort.topics} argument.
#' @export
#' @examples
#' data(APinput)
#' #takes a while
#' \dontrun{o <- fitLDA(APinput$word.id, APinput$doc.id)}
#' data(APtopics) #load output instead for demonstration purposes
#' probs <- getProbs(word.id=APinput$word.id, doc.id=APinput$doc.id, topic.id=APtopics$topics,
#'                    vocab=APinput$vocab, sort.terms="saliency")
#' head(probs$phi.hat[,1:5])
#' head(probs$theta.hat)
#' 


getProbsOld <- function(word.id=numeric(), doc.id=numeric(), topic.id=numeric(), vocab=character(), 
                     alpha=0.01, beta=0.01, sort.topics=c("None", "byDocs", "byTerms"), 
                     sort.terms=c("none", "freq", "distinct", "saliency")) {
  stopifnot(sort.topics[1] %in% c("None", "byDocs", "byTerms"))
  stopifnot(sort.terms[1] %in% c("none", "freq", "distinct", "saliency"))
  if (!all(sort.topics == c("None", "byDocs", "byTerms")) & length(sort.topics) > 1) stop("Please enter only one topic sorting choice")
  if (!all(sort.terms == c("none", "freq", "distinct", "saliency")) & length(sort.terms) > 1) stop("Please enter only one term sorting choice")
  N <- length(word.id)
  stopifnot(N == length(doc.id), N == length(topic.id))
  # compute phi, the matrix of topic-word probability distributions
  df <- table(topic.id, word.id)
  k <- max(topic.id)
  W <- max(word.id)
  D <- max(doc.id)
  stopifnot(W == length(vocab))
  
  CTW <- matrix(0, k, W)
  CTW[, as.numeric(colnames(df))] <- df
  
  # compute theta, the matrix of document-topic probability distributions
  df <- table(doc.id, topic.id)
  CDT <- matrix(0, D, k)
  CDT[as.numeric(rownames(df)),] <- df
  
  # compute posterior point estimates of phi.hat and theta.hat:
  CTW.b <- CTW + beta
  phi.hat <- CTW.b/apply(CTW.b, 1, sum)
  CDT.a <- CDT + alpha
  theta.hat <- CDT.a/apply(CDT.a, 1, sum)
  
  #set relevant names for the two matrices
  rownames(phi.hat) <- rownames(phi.hat, do.NULL=FALSE, prefix= "Topic")
  colnames(phi.hat) <- vocab
  colnames(theta.hat) <- colnames(theta.hat, do.NULL=FALSE, prefix= "Topic")
  
  #sort topics (if necessary)
  topic.o <- NULL
  if (sort.topics[1] == "byDocs") {
    # compute the main topic discussed in each verbatim:
    #maxs <- apply(theta.hat, 1, which.max)
    main.topic <- max.col(CDT)
    # order the topics by the number of documents for which they are the main topic:
    main.topic.table <- table(main.topic)
    topic.o <- order(main.topic.table, decreasing=TRUE)
    main.topic <- match(main.topic, topic.o)
  }
  if (sort.topics[1] == "byTerms") {
    topic.o <- order(apply(CTW, 1, sum), decreasing=TRUE)
  }
  if (!is.null(topic.o)) {
    phi.hat <- phi.hat[topic.o,]
    theta.hat <- theta.hat[,topic.o]
    topic.id <- match(topic.id, topic.o)
  }
  #sort terms (if necessary)
  term.o <- NULL
  if (sort.terms[1] != "none") {
    word.tab <- table(word.id)
    if (sort.terms[1] == "freq") {
      term.o <- order(word.tab, decreasing=TRUE)
    } else {
      if (sort.terms[1] %in% c("distinct", "saliency")) {
        topic.tab <- table(topic.id)
        pt <- topic.tab/sum(topic.tab)
        t.w <- t(t(phi.hat)/apply(phi.hat, 2, sum)) #P(T|w)
        kernel <- t.w*log(t.w/as.vector(pt))
        distinct <- apply(kernel, 2, sum)
      }
      if (sort.terms == "distinct") term.o <- order(distinct, decreasing=TRUE)
      if (sort.terms == "saliency") {
        pw <- word.tab/sum(word.tab)
        saliency <- pw*distinct
        term.o <- order(saliency, decreasing=TRUE)
      }
    }
  }
  if (!is.null(term.o)) phi.hat <- phi.hat[,term.o]
  if (sort.topics[1] != "byDocs") main.topic=NULL
  return(list(phi.hat=phi.hat, theta.hat=theta.hat, topic.id=topic.id, main.topic=main.topic))
}