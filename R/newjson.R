#' Create the JSON object to read into the javascript visualization
#' 
#' This function creates the JSON object that feeds the javascript visualization
#' that is currently stored in 'path-to-LDAvis/LDAvis/inst/htmljs/'
#' 
#' @param phi matrix, with each row containing the distribution over terms 
#' for a topic, with as many rows as there are topics in the model, and as 
#' many columns as there are terms in the vocabulary.
#'
#' @param theta matrix, with each row containing the probability distribution
#' over topics for a document, with as many rows as there are documents in the
#' corpus, and as many columns as there are topics in the model.
#'
#' @param alpha numeric vector with as many elements as there are topics in the
#' model, containing the parameters of the Dirichlet prior distribution
#' over topics for each document.
#'
#' @param beta numeric vector with as many elements as there are terms in the
#' vocabulary, containing the parameters of the Dirichlet prior distribution
#' over terms for each topic.
#'
#' @param doc.length integer vector containing the number of tokens in each
#' document in the corpus.
#'
#' @param vocab character vector of the terms in the vocabulary (in the same
#' order as the columns of \code{phi} and the elements of \code{beta}).
#'
#' @param term.frequency integer vector containing the frequency of each term 
#' in the vocabulary.
#'
#' @param R integer, the number of terms to display in the barcharts
#' of the interactive viz. Default is 30. Recommended to be roughly
#' between 10 and 50.
#' 
#' @param print.progress logical; should the function print progress to 
#' the screen during computation?
#'
#' @details The function first computes the topic frequencies (across the whole
#' corpus), and then it reorders the topics in decreasing order of 
#' frequency. The main computation is to loop through the topics and through
#' 101 values of lambda (0, 0.01, 0.02, .., 1) to compute the R most 
#' \emph{relevant} terms for each topic and value of lambda.
#' If \code{print.progress = TRUE}
#' progress in this loop (which can take a minute or two) will print to the
#' screen.

#' @references Sievert, C. and Shirley, K. (2014) \emph{LDAvis: A Method for
#' Visualizing and Interpreting Topics}, ACL Workshop on Interactive 
#' Language Learning, Visualization, and Interfaces.
#' \url{http://nlp.stanford.edu/events/illvi2014/papers/sievert-illvi2014.pdf}
#'
#' @return a JSON object in R that can be written to a file to feed the
#' interactive visualization
#' 
#' @seealso \link{serVis}
#' @export
#' @examples
#' 
#'\dontrun{
#'# This example uses news article data from D = 2246 Associated Press
#'articles tokenized and shared by David Blei: 
#'# http://www.cs.princeton.edu/~blei/lda-c/index.html
#'
#'# load the AP data:
#'data(AP, package="LDAvis")
#'
#'# create the json object:
#'json <- newJSON(phi = AP$phi, theta = AP$theta, alpha = AP$alpha, 
#'                beta = AP$beta, doc.length = AP$doc.length, 
#'                vocab = AP$vocab, term.frequency = AP$term.frequency, 
#'                R = 30, print.progress = TRUE)
#'
#'                
#'# To serve it locally:
#'#cat(json, file="path-to-LDAvis/LDAvis/inst/htmljs/lda.json")
#'# from path-to-LDAvis/LDAvis/inst/htmljs/ python -m SimpleHTTPServer
#'
#'# Open vis in a browser!
#'#serVis(json)
#'
#'# By default serVis uses a temporary directory
#'# Instead, we could write files to current working directory
#'#serVis(json, out.dir = '.', open.browser = FALSE)
#'
#'# If you have a GitHub account and want to quickly share with others!
#'serVis(json, as.gist = TRUE)
#'}

newJSON <- function(phi = matrix(), theta = matrix(), alpha = numeric(), 
                    beta = numeric(), doc.length = integer(), 
                    vocab = character(), term.frequency = integer(), R = 30, 
                    print.progress=FALSE) {

  # check input dimensions:
  if (dim(phi)[2] != length(vocab)) stop("Number of terms in vocabulary does 
      not match the number of columns of phi (where each row of phi is a
      probability distribution of terms for a given topic).")
  if (dim(phi)[1] != dim(theta)[2]) stop("Number of rows of phi does not match 
      number of columns of theta; both should be equal to the number of topics 
      in the model.")
  if (!all.equal(rep(1, dim(phi)[1]), apply(phi, 1, sum))) stop("Rows of phi 
      don't all sum to 1.")
  if (!all.equal(rep(1, dim(theta)[1]), apply(theta, 1, sum))) stop("Rows of 
      theta don't all sum to 1.")
  if (length(alpha) != dim(theta)[2]) stop("Length of alpha not equal to number
      of columns of theta; both should be equal to the number of topics in the 
      model.")
  if (length(beta) != length(vocab)) stop("Length of beta not equal to the 
      number of terms in the vocabulary.")
  if (length(doc.length) != dim(theta)[1]) stop("Length of doc.length not equal 
      to the number of rows in theta; both should be equal to the number of 
      documents in the data.")
  if (length(term.frequency) != length(vocab)) stop("Length of term.frequency 
      not equal to the number of terms in the vocabulary.")
  
  # Set some variables:
  D <- length(doc.length)
  W <- length(vocab)
  N <- sum(doc.length)
  K <- dim(theta)[2]
  
  # compute counts of tokens across K topics (length-K vector):
  # (this determines the areas of the default topic circles when no term is 
  # highlighted)
  topic.frequency <- apply(doc.length * theta, 2, sum)
  topic.proportion <- topic.frequency/sum(topic.frequency)

  # re-order the K topics in order of decreasing proportion:
  o <- order(topic.proportion, decreasing=TRUE)
  phi <- phi[o, ]
  theta <- theta[, o]
  alpha <- alpha[o]
  topic.frequency <- topic.frequency[o]
  topic.proportion <- topic.proportion[o]

  # compute counts of tokens for each term-topic combination (W x K matrix)
  # (this determines the widths of the pink bars)
  term.topic.frequency <- phi * topic.frequency  
  # adjust to match term frequencies exactly (get rid of rounding error)
  term.topic.frequency <- t(t(term.topic.frequency)/apply(term.topic.frequency, 
                            2, sum)*term.frequency)

  # compute marginal distribution over terms:
  # (note that the term frequencies input by the user determine the widths 
  # of the gray bars):
  term.proportion <- term.frequency/sum(term.frequency)

  # compute the distinctiveness and saliency of the terms:
  # this determines the R that are displayed when no topic is selected
  topic.given.term <- t(t(phi)/apply(phi, 2, sum))  # (K x W)
  kernel <- topic.given.term * log(topic.given.term/topic.proportion)
  distinctiveness <- colSums(kernel)
  saliency <- term.proportion * distinctiveness

  # compute distance between topics:
  # this determines the layout of the circles on the left panel of the vis
  Jensen.Shannon <- function(x, y) {
    m <- 0.5*(x + y)
    0.5*sum(x*log(x/m)) + 0.5*sum(y*log(y/m))
  }
  dist.mat <- proxy::dist(x = phi, method = Jensen.Shannon) 
  fit.cmd <- cmdscale(dist.mat, k = 2)
  x <- fit.cmd[, 1]
  y <- fit.cmd[, 2]
  lab <- 1:K
  mds.df <- data.frame(x, y, topics=lab, Freq=topic.proportion*100, 
                       cluster=1, stringsAsFactors=FALSE)
  # note: cluster can be depracated soon.

  # Order the terms for the "default" view by decreasing saliency:
  default <- data.frame(Term=vocab[order(saliency, decreasing=TRUE)][1:R], 
                        Category="Default", stringsAsFactors=FALSE)
  counts <- term.frequency[match(default$Term, vocab)]
  default$Freq <- as.integer(counts)
  default$Total <- as.integer(counts)

  # Loop through and collect R most relevant terms for each topic for 
  # every value of lambda in c(0, 0.01, 0.02, ..., 1):
  # (to-do: replace this nested loop with a C function to make it faster)
  lambda.seq <- seq(0, 1, by = 0.01)
  n.lambda <- length(lambda.seq)
  term.vectors <- as.list(rep(0, K))
  if (print.progress) {
    print(paste0("Looping through ", K, " topics to compute top-", R, 
                 " most relevant terms for grid of lambda values"))
  }
  for (k in 1:K) {
    if (print.progress) print(paste0("Topic ", k))
    phi.k <- phi[k ,]
    lift <- phi.k/term.proportion
    term.vectors[[k]] <- data.frame(term=rep("", R*n.lambda), 
                                    logprob=numeric(R*n.lambda), 
                                    loglift=numeric(R*n.lambda), 
                                    stringsAsFactors=FALSE)
    # loop through values of lambda:
    for (l in 1:n.lambda) {
      relevance <- lambda.seq[l]*log(phi.k) + (1 - lambda.seq[l])*log(lift)
      o <- order(relevance, phi.k, decreasing=TRUE) # break ties with phi
      rows <- 1:R + (l - 1)*R
      term.vectors[[k]][rows, 1] <- vocab[o[1:R]]
      term.vectors[[k]][rows, 2] <- round(log(phi[k, o[1:R]]), 4)
      term.vectors[[k]][rows, 3] <- round(log(lift[o[1:R]]), 4)
    }
  }

  topic.info <- lapply(term.vectors, function(x) unique(x))
  tinfo <- do.call("rbind", topic.info)
  n.topic <- sapply(topic.info, nrow)
  tinfo$Freq <- term.topic.frequency[cbind(rep(1:K, n.topic), 
                                           match(tinfo[, 1], vocab))]
  tinfo$Total <- term.frequency[match(tinfo[, "term"], vocab)]
  tinfo$Category <- paste0("Topic", rep(1:K, n.topic))
  colnames(tinfo)[1] <- "Term"

  # Add in the most salient terms (the default view):
  default <- data.frame(Term=default[, "Term"], logprob=R:1, 
                        loglift=R:1, default[, c(3, 4, 2)])
  tinfo <- rbind(tinfo, default)

  # last, to compute the areas of the circles when a term is highlighted
  # we must gather all unique terms that could show up (for every combination 
  # of topic and value of lambda) and compute its distribution over topics.

  # unique terms across all topics and all values of lambda
  ut <- sort(unique(tinfo[, 1]))
  # indices of unique terms in the vocab
  m <- sort(match(ut, vocab))
  # term-topic frequency table
  tmp <- term.topic.frequency[, m]

  # round down infrequent term occurrences so that we can send sparse 
  # data to the browser:
  r <- row(tmp)[tmp >= 0.5]
  c <- col(tmp)[tmp >= 0.5]
  dd <- data.frame(Term=vocab[m][c], Topic=r, Freq=round(tmp[cbind(r, c)]), 
                   stringsAsFactors=FALSE)

  # Normalize token frequencies:
  dd[, "Freq"] <- dd[, "Freq"]/term.frequency[match(dd[, "Term"], vocab)]
  token.table <- dd[order(dd[, 1], dd[, 2]), ]

  json.data <- RJSONIO::toJSON(list(mdsDat=mds.df, tinfo=tinfo, 
                                    token.table=token.table, R=R))
  return(json.data)
}
