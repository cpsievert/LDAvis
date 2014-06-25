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
#' @param dist.measure the measure used to determine the distance between topics. 
#' Curent options are "JS" for Jensen-Shannon divergence and "KL" for symmetric
#' Kullback-Leibler divergence.
#'
#' @return an JSON object in R that can be written to a file to feed the
#' interactive visualization
#' 
#' @seealso \link{serVis}
#' @export
#' @examples
#' 
#' # This example uses Newsgroup documents from 
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
#' # Note that the topics have been re-ordered by check.inputs
#' with(Newsgroupdata, colnames(phi))
#' with(z, colnames(phi))
#' # So has topic.proportion
#' with(Newsgroupdata, order(topic.proportion))
#' with(z, order(topic.proportion))
#' 
#' # Relabel topics so that topic "1" has highest topic proportion.
#' colnames(z$phi) <- seq_len(z$K)
#' \dontrun{
#' # Takes 1-2 minutes to set up the data:
#' json <- with(z, createJSON(K=K, phi=phi, 
#'                  term.frequency=term.frequency, vocab=vocab, 
#'                  topic.proportion=topic.proportion, n.terms=30))
#'                  
#'  # Open vis in a browser!
#'  serVis(json)
#'  # By default serVis uses a temporary directory
#'  # Instead, we could write files to current working directory
#'  serVis(json, out.dir = '.', open.browser = FALSE)
#'  # If you have a GitHub account and want to quickly share with others!
#'  serVis(json, as.gist = TRUE)
#' }
#'


createJSON <- function(K = integer(), phi = matrix(), 
                       term.frequency = integer(), vocab = character(), 
                       topic.proportion = numeric(), n.terms = 30, dist.measure = "JS") {

  if (length(vocab) == 0) vocab <- row.names(phi)
  
  # Set some relevant local variables and run a few basic checks:
  N <- sum(term.frequency)
  W <- length(vocab)
  rel.freq <- term.frequency/N
  phi.freq <- t(t(phi) * topic.proportion * N)
  
  #Should we `check.inputs()` here?

  # compute the distinctiveness and saliency of the tokens:
  t.w <- phi/apply(phi, 1, sum)
  t.w.t <- t(t.w)  # dimension should be K x W
  kernel <- t.w.t * log(t.w.t/topic.proportion)
  distinct <- colSums(kernel)
  saliency <- rel.freq * colSums(kernel)

  # compute distance between topics (using only the first 2000 terms):
  d <- proxy::dist(t(phi), method = distance(measure = dist.measure)) 
  fit.cmd <- cmdscale(d, k=2)
  x <- fit.cmd[, 1]
  y <- fit.cmd[, 2]
  lab <- 1:K
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
    phi.k <- phi[, k]
    lift <- phi.k/marginal
    term.vectors[[k]] <- data.frame(term=rep("", n.terms*ll), 
                                    logprob=numeric(n.terms*ll), 
                                    loglift=numeric(n.terms*ll), 
                                    stringsAsFactors=FALSE)
    # loop through values of lambda:
    for (l in 1:ll) {
      relevance <- lambda.seq[l]*log(phi.k) + (1 - lambda.seq[l])*log(lift)
      o <- order(relevance, phi.k, decreasing=TRUE) # break ties with phi
      rows <- 1:n.terms + (l - 1)*n.terms
      term.vectors[[k]][rows, 1] <- vocab[o[1:n.terms]]
      term.vectors[[k]][rows, 2] <- round(log(phi[o[1:n.terms], k]), 4)
      term.vectors[[k]][rows, 3] <- round(log(lift[o[1:n.terms]]), 4)
    }
    
  }
  
  topic.info <- lapply(term.vectors, function(x) unique(x))
  tinfo <- do.call("rbind", topic.info)
  n.topic <- sapply(topic.info, nrow)  

  tinfo$Freq <- exp(tinfo$logprob)*N*topic.proportion[rep(1:K, n.topic)]
  tinfo$Total <- term.frequency[match(tinfo[, "term"], vocab)]
  tinfo$Category <- paste0("Topic", rep(1:K, n.topic))
  colnames(tinfo)[1] <- "Term"

  # Add in the most salient terms (the default view):
  default <- data.frame(Term=default[, "Term"], logprob=n.terms:1, 
                        loglift=n.terms:1, default[, c(3, 4, 2)])
  tinfo <- rbind(tinfo, default)

  # unique terms across all topics and all values of lambda
  ut <- sort(unique(tinfo[, 1]))
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

  json.data <- RJSONIO::toJSON(list(mdsDat=mds.df, tinfo=tinfo, token.table=token.table))
  return(json.data)
}


  