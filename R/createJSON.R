#' Create the JSON object to read into the javascript visualization
#' 
#' This function creates the JSON object that feeds the visualization template.
#' For a more detailed overview, 
#' see \code{vignette("details", package = "LDAvis")}
#' 
#' @param phi matrix, with each row containing the distribution over terms 
#' for a topic, with as many rows as there are topics in the model, and as 
#' many columns as there are terms in the vocabulary.
#' @param theta matrix, with each row containing the probability distribution
#' over topics for a document, with as many rows as there are documents in the
#' corpus, and as many columns as there are topics in the model.
#' @param doc.length integer vector containing the number of tokens in each
#' document of the corpus.
#' @param vocab character vector of the terms in the vocabulary (in the same
#' order as the columns of \code{phi}). Each term must have at least one
#' character.
#' @param term.frequency integer vector containing the frequency of each term 
#' in the vocabulary.
#' @param R integer, the number of terms to display in the barcharts
#' of the interactive viz. Default is 30. Recommended to be roughly
#' between 10 and 50.
#' @param lambda.step a value between 0 and 1. 
#' Determines the interstep distance in the grid of lambda 
#' values over which to iterate when computing relevance.
#' Default is 0.01. Recommended to be between 0.01 and 0.1. 
#' @param mds.method a function that takes \code{phi} as an input and outputs
#' a K by 2 data.frame (or matrix). The output approximates the distance
#' between topics. See \link{jsPCA} for details on the default method.
#' @param cluster a cluster object created from the \link{parallel} package. 
#' If supplied, computations are performed using \link{parLapply} instead
#' of \link{lapply}.
#' @param plot.opts a named list used to customize various plot elements. 
#' By default, the x and y axes are labeled "PC1" and "PC2" 
#' (principal components 1 and 2), since \link{jsPCA} is the default
#' scaling method.
#' @param ... not currently used.
#'
#' @details The function first computes the topic frequencies (across the whole
#' corpus), and then it reorders the topics in decreasing order of 
#' frequency. The main computation is to loop through the topics and through the
#' grid of lambda values (determined by \code{lambda.step})
#' to compute the \code{R} most 
#' \emph{relevant} terms for each topic and value of lambda.
#'
#' @return A string containing JSON content which can be written to a file 
#' or feed into \link{serVis} for easy viewing/sharing. One element of this 
#' string is the new ordering of the topics.
#'
#' @seealso \link{serVis}
#' @references Sievert, C. and Shirley, K. (2014) \emph{LDAvis: A Method for
#' Visualizing and Interpreting Topics}, ACL Workshop on Interactive 
#' Language Learning, Visualization, and Interfaces.
#' \url{http://nlp.stanford.edu/events/illvi2014/papers/sievert-illvi2014.pdf}
#'
#' @export
#' @examples
#' 
#' \dontrun{
#' data(TwentyNewsgroups, package="LDAvis")
#' # create the json object, start a local file server, open in default browser
#' json <- with(TwentyNewsgroups, 
#'              createJSON(phi, theta, doc.length, vocab, term.frequency))
#' serVis(json) # press ESC or Ctrl-C to kill
#' 
#' # createJSON() reorders topics in decreasing order of term frequency
#' RJSONIO::fromJSON(json)$topic.order
#' 
#' # You may want to just write the JSON and other dependency files 
#' # to a folder named TwentyNewsgroups under the working directory
#' serVis(json, out.dir = 'TwentyNewsgroups', open.browser = FALSE)
#' # then you could use a server of your choice; for example,
#' # open your terminal, type `cd TwentyNewsgroups && python -m SimpleHTTPServer`
#' # then open http://localhost:8000 in your web browser
#'
#' # A different data set: the Jeopardy Questions+Answers data:
#' # Install LDAvisData (the associated data package) if not already installed:
#' # devtools::install_github("cpsievert/LDAvisData")
#' library(LDAvisData)
#' data(Jeopardy, package="LDAvisData")
#' json <- with(Jeopardy, 
#'              createJSON(phi, theta, doc.length, vocab, term.frequency))
#' serVis(json) # Check out Topic 22 (bodies of water!)
#' 
#' # If you have a GitHub account, you can even publish as a gist
#' # which allows you to easily share with others!
#' serVis(json, as.gist = TRUE)
#' 
#' # Run createJSON on a cluster of machines to speed it up
#' system.time(
#' json <- with(TwentyNewsgroups, 
#'              createJSON(phi, theta, doc.length, vocab, term.frequency))
#' )
#' #   user  system elapsed 
#' # 14.415   0.800  15.066 
#' library("parallel")
#' cl <- makeCluster(detectCores() - 1)
#' cl # socket cluster with 3 nodes on host 'localhost'
#' system.time(
#'  json <- with(TwentyNewsgroups, 
#'    createJSON(phi, theta, doc.length, vocab, term.frequency, 
#'      cluster = cl))
#' )
#' #   user  system elapsed 
#' #  2.006   0.361   8.822
#' 
#' # another scaling method (svd + tsne)
#' library("tsne")
#' svd_tsne <- function(x) tsne(svd(x)$u)
#' json <- with(TwentyNewsgroups, 
#'              createJSON(phi, theta, doc.length, vocab, term.frequency, 
#'                         mds.method = svd_tsne, 
#'                         plot.opts = list(xlab="", ylab="")
#'                         )
#'              )
#' serVis(json) # Results in a different topic layout in the left panel
#' 
#'}

createJSON <- function(phi = matrix(), theta = matrix(), doc.length = integer(), 
                       vocab = character(), term.frequency = integer(), R = 30, 
                       lambda.step = 0.01, mds.method = jsPCA, cluster, 
                       plot.opts = list(xlab = "PC1", ylab = "PC2"), 
                       ...) {
  # Set the values of a few summary statistics of the corpus and model:
  dp <- dim(phi)  # should be K x W
  dt <- dim(theta)  # should be D x K

  N <- sum(doc.length)  # number of tokens in the data
  W <- length(vocab)  # number of terms in the vocab
  D <- length(doc.length)  # number of documents in the data
  K <- dt[2]  # number of topics in the model

  # check that certain input dimensions match
  if (dp[1] != K) stop("Number of rows of phi does not match 
      number of columns of theta; both should be equal to the number of topics 
      in the model.")  
  if (D != dt[1]) stop("Length of doc.length not equal 
      to the number of rows in theta; both should be equal to the number of 
      documents in the data.")
  if (dp[2] != W) stop("Number of terms in vocabulary does 
      not match the number of columns of phi (where each row of phi is a
      probability distribution of terms for a given topic).")
  if (length(term.frequency) != W) stop("Length of term.frequency 
      not equal to the number of terms in the vocabulary.")
  if (any(nchar(vocab) == 0)) stop("One or more terms in the vocabulary
      has zero characters -- all terms must have at least one character.")

  # check that conditional distributions are normalized:
  phi.test <- all.equal(rowSums(phi), rep(1, K), check.attributes = FALSE)
  theta.test <- all.equal(rowSums(theta), rep(1, dt[1]), 
                          check.attributes = FALSE)
  if (!isTRUE(phi.test)) stop("Rows of phi don't all sum to 1.")
  if (!isTRUE(theta.test)) stop("Rows of theta don't all sum to 1.")

  # compute counts of tokens across K topics (length-K vector):
  # (this determines the areas of the default topic circles when no term is 
  # highlighted)
  topic.frequency <- colSums(theta * doc.length)
  topic.proportion <- topic.frequency/sum(topic.frequency)

  # re-order the K topics in order of decreasing proportion:
  o <- order(topic.proportion, decreasing = TRUE)
  phi <- phi[o, ]
  theta <- theta[, o]
  topic.frequency <- topic.frequency[o]
  topic.proportion <- topic.proportion[o]
  
  # compute intertopic distances using the specified multidimensional
  # scaling method:
  mds.res <- mds.method(phi)
  if (is.matrix(mds.res)) {
    colnames(mds.res) <- c("x", "y")
  } else if (is.data.frame(mds.res)) {
    names(mds.res) <- c("x", "y")
  } else {
    warning("Result of mds.method should be a matrix or data.frame.")
  }  
  mds.df <- data.frame(mds.res, topics = seq_len(K), Freq = topic.proportion*100, 
                       cluster = 1, stringsAsFactors = FALSE)
  # note: cluster (should?) be deprecated soon.

  # token counts for each term-topic combination (widths of red bars)
  term.topic.frequency <- phi * topic.frequency  
  
  # compute term frequencies as column sums of term.topic.frequency
  # we actually won't use the user-supplied term.frequency vector.
  # the term frequencies won't match the user-supplied frequencies exactly
  # this is a work-around to solve the bug described in Issue #32 on github:
  # https://github.com/cpsievert/LDAvis/issues/32
  term.frequency <- colSums(term.topic.frequency)
  stopifnot(all(term.frequency > 0))

  # marginal distribution over terms (width of blue bars)
  term.proportion <- term.frequency/sum(term.frequency)

  # Old code to adjust term frequencies. Deprecated for now
  # adjust to match term frequencies exactly (get rid of rounding error)
  #err <- as.numeric(term.frequency/colSums(term.topic.frequency))
  # http://stackoverflow.com/questions/3643555/multiply-rows-of-matrix-by-vector
  #term.topic.frequency <- sweep(term.topic.frequency, MARGIN=2, err, `*`)

  # Most operations on phi after this point are across topics
  # R has better facilities for column-wise operations
  phi <- t(phi)

  # compute the distinctiveness and saliency of the terms:
  # this determines the R terms that are displayed when no topic is selected
  topic.given.term <- phi/rowSums(phi)  # (W x K)
  kernel <- topic.given.term * log(sweep(topic.given.term, MARGIN=2, 
                                         topic.proportion, `/`))
  distinctiveness <- rowSums(kernel)
  saliency <- term.proportion * distinctiveness

  # Order the terms for the "default" view by decreasing saliency:
  default.terms <- vocab[order(saliency, decreasing = TRUE)][1:R]
  counts <- as.integer(term.frequency[match(default.terms, vocab)])
  Rs <- rev(seq_len(R))
  default <- data.frame(Term = default.terms, logprob = Rs, loglift = Rs, 
                        Freq = counts, Total = counts, Category = "Default", 
                        stringsAsFactors = FALSE)
  topic_seq <- rep(seq_len(K), each = R)
  category <- paste0("Topic", topic_seq)
  lift <- phi/term.proportion

  # Collect R most relevant terms for each topic/lambda combination
  # Note that relevance is re-computed in the browser, so we only need
  # to send each possible term/topic combination to the browser
  find_relevance <- function(i) {
    relevance <- i*log(phi) + (1 - i)*log(lift)
    idx <- apply(relevance, 2, 
                 function(x) order(x, decreasing = TRUE)[seq_len(R)])
    # for matrices, we pick out elements by their row/column index
    indices <- cbind(c(idx), topic_seq)
    data.frame(Term = vocab[idx], Category = category,
               logprob = round(log(phi[indices]), 4),
               loglift = round(log(lift[indices]), 4),
               stringsAsFactors = FALSE)
  }
  lambda.seq <- seq(0, 1, by=lambda.step)
  if (missing(cluster)) {
    tinfo <- lapply(as.list(lambda.seq), find_relevance)
  } else {
    tinfo <- parallel::parLapply(cluster, as.list(lambda.seq), find_relevance)
  }
  tinfo <- unique(do.call("rbind", tinfo))
  tinfo$Total <- term.frequency[match(tinfo$Term, vocab)]
  rownames(term.topic.frequency) <- paste0("Topic", seq_len(K))
  colnames(term.topic.frequency) <- vocab
  tinfo$Freq <- term.topic.frequency[as.matrix(tinfo[c("Category", "Term")])]
  tinfo <- rbind(default, tinfo)
  
  # last, to compute the areas of the circles when a term is highlighted
  # we must gather all unique terms that could show up (for every combination 
  # of topic and value of lambda) and compute its distribution over topics.

  # unique terms across all topics and all values of lambda
  ut <- sort(unique(tinfo$Term))
  # indices of unique terms in the vocab
  m <- sort(match(ut, vocab))
  # term-topic frequency table
  tmp <- term.topic.frequency[, m]

  # round down infrequent term occurrences so that we can send sparse 
  # data to the browser:
  r <- row(tmp)[tmp >= 0.5]
  c <- col(tmp)[tmp >= 0.5]
  dd <- data.frame(Term = vocab[m][c], Topic = r, Freq = round(tmp[cbind(r, c)]), 
                   stringsAsFactors = FALSE)

  # Normalize token frequencies:
  dd[, "Freq"] <- dd[, "Freq"]/term.frequency[match(dd[, "Term"], vocab)]
  token.table <- dd[order(dd[, 1], dd[, 2]), ]
  
  RJSONIO::toJSON(list(mdsDat = mds.df, tinfo = tinfo, 
                       token.table = token.table, R = R, 
                       lambda.step = lambda.step,
                       plot.opts = plot.opts, 
                       topic.order = o))
}


#' Dimension reduction via Jensen-Shannon Divergence & Principal Components
#' 
#' @param phi matrix, with each row containing the distribution over terms 
#' for a topic, with as many rows as there are topics in the model, and as 
#' many columns as there are terms in the vocabulary.
#' 
#' @export
jsPCA <- function(phi) {
  # first, we compute a pairwise distance between topic distributions
  # using a symmetric version of KL-divergence
  # http://en.wikipedia.org/wiki/Jensen%E2%80%93Shannon_divergence
  jensenShannon <- function(x, y) {
    m <- 0.5*(x + y)
    0.5*sum(x*log(x/m)) + 0.5*sum(y*log(y/m))
  }
  dist.mat <- proxy::dist(x = phi, method = jensenShannon)
  # then, we reduce the K by K proximity matrix down to K by 2 using PCA
  pca.fit <- stats::cmdscale(dist.mat, k = 2)
  data.frame(x = pca.fit[,1], y = pca.fit[,2])
}
