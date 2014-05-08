#' Create the JSON object to read into the javascript visualization
#' 
#' This function creates the JSON object that feeds the javascript visualization
#' that is currently stored in 'path-to-LDAvis/LDAvis/inst/html/'
#' 
#' @param K integer, number of topics in the fitted LDA model
#'
#' @param phi matrix, term-topic distributions, where there are as many rows
#' as terms in the vocabulary, and K columns, one per topic.
#'
#' @param term.frequency numeric, the frequency of each term in the vocabulary,
#' which can contain non-integer values as a result of smoothing via priors.
#'
#' @param vocab character vector of the terms in the vocabulary (in the same
#' order as the rows of \code{phi})
#'
#' @param topic.proportion numeric, the proportion of tokens generated from
#' each topic across the corpus, with length equal to K.
#'
#' @param n.terms integer, the number of terms to display in the barcharts
#' of the interactive viz. Default is 30. Recommended to be between 10 and 50.
#'
#' @return an JSON object in R that can be written to a file to feed the
#' interactive visualization
#' 
#' @export
#' @examples
#' 
#' # Example using Newsgroup documents from 
#' # http://qwone.com/~jason/20Newsgroups/
#'
#' data("Newsgroupdata", package = "LDAvis")
#'
#' # Check the inputs and sort topics by frequency:
#' z <- check.inputs(K=50, W=22524, phi=Newsgroupdata$phi, 
#'                   term.frequency=Newsgroupdata$term.frequency, 
#'                   vocab=Newsgroupdata$vocab, 
#'                   topic.proportion=Newsgroupdata$topic.proportion)
#'
#' # Assign the elements of Newsgroupdata to global variables
#' # and note that the topics have been re-ordered
#' for (i in 1:length(z)) assign(names(z)[i], z[[i]])
#' colnames(phi) <- 1:K
#'
#' # This function takes 1-2 minutes to set up the data:
#' json <- createJSON(K=K, phi=phi, term.frequency=term.frequency, vocab=vocab, 
#'                    topic.proportion=topic.proportion, n.terms=30)
#'
#' # Save the object to a .json file in the LDAvis/inst/html/ directory
#' cat(json, file="path-to-LDAvis/LDAvis/inst/html/lda.json")
#'
#' # From 'path-to-LDAvis/LDAvis/inst/html/' serve the page locally
#' # by typing 'python -m SimpleHTTPServer' into the terminal
#' # and enter 'localhost:8000' into your browser

createJSON <- function(K = integer(), phi = matrix(), 
                       term.frequency = integer(), vocab = character(), 
                       topic.proportion, n.terms = 30) {

  # function to compute jensen-shannon divergence:
  jensen.shannon.divergence <- function(p, q) {
    m <- 0.5*(p + q)
    0.5*sum(p*log(p/m)) + 0.5*sum(q*log(q/m))
  }
  
  # Set some relevant local variables and run a few basic checks:
  N <- sum(term.frequency)
  W <- length(vocab)
  rel.freq <- term.frequency/N
  phi.freq <- t(t(phi) * topic.proportion * N)

  # compute the distinctiveness and saliency of the tokens:
  t.w <- phi/apply(phi, 1, sum)
  t.w.t <- t(t.w)  # dimension should be K x W
  kernel <- t.w.t * log(t.w.t/topic.proportion)
  distinct <- colSums(kernel)
  saliency <- rel.freq * colSums(kernel)

  # compute distance between topics (using only the first 2000 tokens):
  d <- dist(t(phi), jensen.shannon.divergence)
  fit.cmd <- cmdscale(d, k=2)
  x <- fit.cmd[, 1]
  y <- fit.cmd[, 2]
  lab <- gsub("Topic", "", names(x))
  loc.df <- data.frame(x, y, topics=lab, stringsAsFactors=FALSE)

  # create the topics data.frame:
  topics.df <- data.frame(topics=1:K, Freq=as.numeric(topic.proportion*100))

  # join the MDS location data.frame with the Topic Frequency data.frame
  mds.df <- data.frame(loc.df, Freq=topics.df[, "Freq"])

  # add cluster = 1 for all topics:
  mds.df$cluster <- 1

  # Order the terms for the "default" view by decreasing saliency:
  default <- data.frame(Term=vocab[order(saliency, decreasing=TRUE)][1:n.terms], 
                       Category="Default", stringsAsFactors=FALSE)
  counts <- apply(phi.freq[match(default$Term, vocab), ], 1, sum)
  default$Freq <- as.integer(counts)
  default$Total <- as.integer(counts)

  # Loop through and collect n.token most relevant terms for each topic for 
  # every value of lambda in c(0, 0.01, 0.02, ..., 1) for N.token = 30 
  # most relevant tokens:
  # replace this nested loop with a C function to make it faster:
  marginal <- term.frequency/sum(term.frequency)
  lambda.seq <- seq(0, 1, 0.01)
  ll <- length(lambda.seq)
  term.vectors <- as.list(rep(0, K))
  print(paste0("Looping through topics to compute top-", n.terms, 
               " most relevant terms for grid of lambda values"))
  for (k in 1:K) {
    print(k)
    lift <- phi[, k]/marginal
    term.vectors[[k]] <- data.frame(term=rep("", n.terms*ll), 
                                    logprob=numeric(n.terms*ll), 
                                    loglift=numeric(n.terms*ll), 
                                    stringsAsFactors=FALSE)
    # loop through values of lambda:
    for (l in 1:ll) {
      relevance <- lambda.seq[l]*log(phi[, k]) + (1 - lambda.seq[l])*log(lift)
      o <- order(relevance, phi[, k], decreasing=TRUE) # break ties with phi
      rows <- 1:n.terms + (l - 1)*n.terms
      term.vectors[[k]][rows, 1] <- vocab[o[1:n.terms]]
      term.vectors[[k]][rows, 2] <- round(log(phi[o[1:n.terms], k]), 4)
      term.vectors[[k]][rows, 3] <- round(log(lift[o[1:n.terms]]), 4)
    }
  }
  topic.info <- as.list(rep(NA, K))
  for (k in 1:K) topic.info[[k]] <- unique(term.vectors[[k]])

  # add the topic info to zz:
  n.topic <- unlist(lapply(topic.info, dim))[seq(1, by=2, length=K)]
  tinfo <- topic.info[[1]]
  for (k in 2:K) {
    tinfo <- rbind(tinfo, topic.info[[k]])
  }
  tinfo$Freq <- exp(tinfo$logprob)*N*topic.proportion[rep(1:K, n.topic)]
  tinfo$Total <- term.frequency[match(tinfo[, "term"], vocab)]
  tinfo$Category <- paste0("Topic", rep(1:K, n.topic))
  colnames(tinfo)[1] <- "Term"

  # Add in the most salient terms (the default view):
  default <- data.frame(Term=default[, "Term"], logprob=n.terms:1, 
                        loglift=n.terms:1, default[, c(3, 4, 2)])
  tinfo <- rbind(tinfo, default)

  # unique terms across all topics and all values of lambda
  ut <- su(tinfo[, 1])
  # indices of unique terms in the vocab
  m <- sort(match(ut, vocab))
  # term-topic frequency table
  tmp <- phi.freq[m, ]

  # round down infrequent term occurrences:
  r <- row(tmp)[tmp >= 0.5]
  c <- col(tmp)[tmp >= 0.5]
  dd <- data.frame(Term=vocab[m][r], Topic=c, Freq=round(tmp[cbind(r, c)]), 
                   stringsAsFactors=FALSE)

  # Normalize token frequencies:
  m.sum <- apply(phi.freq, 1, sum)[m]
  dd[, "Freq"] <- dd[, "Freq"]/m.sum[r]
  token.table <- dd[order(dd[, 1], dd[, 2]), ]

  json.data <- toJSON(list(mdsDat=mds.df, tinfo=tinfo, token.table=token.table))
  return(json.data)
}


  