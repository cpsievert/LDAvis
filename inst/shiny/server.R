library(shiny)
library(proxy)
library(plyr)
library(reshape2)

# If you'd like to debug outside of shiny...
#input <- NULL
#input$kmeans <- 1
#input$lambda <- 1/3
#input$nTerms <- 35

KL <- function(x, y) { #compute Kullback-Leibler divergence
  .5*sum(x*log(x/y)) + .5*sum(y*log(y/x))
}

# This app assumes that 'phi' and 'freq' exist in the global environment.
# This is not optimal, but it will have to do for now
# See this discussion on passing arguments to shiny apps -- https://groups.google.com/forum/#!topic/shiny-discuss/y0MTpt5I_DE

# These objects won't change and will be reused in computing various things
dim.phi <- dim(phi)
k <- min(dim.phi) # number of topics
if (which.min(dim.phi) != 2) stop("Topics should be on the columns of phi")
vocab <- rownames(phi)
topic.labs <- as.character(seq_len(k))       # This will control what labels are used on the points in the scatterplot
colnames(phi) <- paste0("Topic", topic.labs) # This is necessary for subsetting data upon selection in topicz.js
rel.freq <- freq/sum(freq)
# Compute distance matrix between topics, 
# Set cutoff at cumulative marginal prob of 0.8 (aiming for a so-called "80-20 rule")... 
# We *could* have an option to compute different distance measures (this would have to go inside shinyServer)
d <- dist(t(phi[seq_len(min(which(cumsum(rel.freq) > 0.80))), ]), method = KL)
fit <- cmdscale(d, k = 2)
x <- fit[,1]
y <- fit[,2]
loc.df <- data.frame(x, y, topics = topic.labs)
# Infer the marginal topic frequency p(T)
phi.freq <- phi*freq # This is used within app as well
nPerTopic <- colSums(phi.freq)
pT <- nPerTopic/sum(nPerTopic)
topics.df <- data.frame(topics = topic.labs, Freq = 100*pT)
mds.df <- merge(loc.df, topics.df, by="topics", all.x = TRUE, sort = FALSE)


shinyServer(function(input, output) {
  
  output$mdsDat <- reactive({

    # workaround errors if no clustering is done (ie, input$kmeans == 1)
    mds.df$cluster <- 1
    centers <- data.frame(x = 0, y = 0)
    if (input$kmeans > 1) { # and clustering info (if relevant)
      cl <- kmeans(cbind(x, y), input$kmeans)
      mds.df$cluster <- factor(cl$cluster)
      centers <- data.frame(cl$centers)
    }
    
    ##############################################################################
    ### Create a df with the info neccessary to make the default OR new bar chart when selecting a topic or cluster.
    ### This functionality requires that we keep track of the top input$nTerms within each cluster and topic (as well as overall).
    ### The ranking of words under a topic is done via a weighted average of the lift and probability of the word given the topic.
    ### The ranking of words under a cluster is done via a similar weighted average (summing over the relevant topics)
    
    #get the top terms for each topic
    nTermseq <- seq_len(input$nTerms)
    weight <- input$lambda*log(phi) + (1-input$lambda)*log(phi/freq) 
    top.terms <- NULL
    for (i in seq_len(k)) {
      weights <- weight[,i]
      o <- order(weights, decreasing=TRUE)
      terms <- vocab[o][nTermseq]
      top.terms <- c(top.terms, terms)
    }
    term.labs <- rep(paste0("Topic", topic.labs), each = input$nTerms) # We need this labeling or else topicz.js will not subset correctly...
    topic.df <- data.frame(Term = top.terms, Category = term.labs, stringsAsFactors = FALSE)
    
    # get the top terms for each cluster
    clust.terms <- NULL
    if (input$kmeans == 1) {
      #if no clustering is done, we don't want to change the 'most informative words' upon hover
      clust.terms <- terms
    } else {
      for (i in seq_len(input$kmeans)) {
        #grab topics that belong to the current cluster
        topicz <- mds.df$cluster %in% i
        sub.phi <- phi[, topicz]
        #only sum if multiple columns exist
        if (!is.null(dim(sub.phi))) {
          sub.phi <- apply(t(sub.phi)*pT[topicz], 2, sum)  # weighted by topic term frequency
        }
        weight <- input$lambda*log(sub.phi) + (1 - input$lambda)*log(sub.phi/freq)
        o <- order(weight, decreasing=TRUE)
        terms <- vocab[o][nTermseq]
        clust.terms <- c(clust.terms, terms)
      } 
    }
    term.labs <- rep(paste0("Cluster", 1:input$kmeans), each = input$nTerms)
    clust.df <- data.frame(Term = clust.terms, Category = term.labs, stringsAsFactors = FALSE)
    
    # compute the distinctiveness and saliency of the tokens:
    t.w <- t(pT*t(phi))/freq  # P(T|w) = P(T)*P(w|T)/P(w) 
    t.w.t <- t(t.w)           # Change dimensions from V x K to K x V
    kernel <- t.w.t*log(t.w.t/pT)
    saliency <- freq*colSums(kernel)
    # By default, order the terms by saliency:
    top.df <- data.frame(Term = vocab[order(saliency, decreasing = TRUE)][nTermseq], Category = "Default")
    
    # put together the most salient words with the top words for each topic/cluster
    all.df <- rbind(topic.df, clust.df, top.df)
    # Overall frequency for each possible word
    all.df$Total <- freq[match(all.df$Term, vocab)]
    # Initiate topic/cluster specific frequencies with 0 since that is used for the 'default' category
    all.df$Freq <- 0
    
    # Collect P(w|T) for each possible word
    all.words <- unique(all.df$Term)
    keep <- vocab %in% all.words
    phi2 <- data.frame(phi.freq[keep, ], Term = vocab[keep])
    t.phi <- reshape2::melt(phi2, id.vars = "Term", variable.name = "Category", value.name = "Freq2")
    all.df <- merge(all.df, t.phi, all.x = TRUE, sort = FALSE)
    # Collect P(w|Cluster) for each possible word
    c.phi <- merge(t.phi, data.frame(Category = mds.df$topics, cluster = paste0("Cluster", mds.df$cluster)), 
                   all.x = TRUE, sort = FALSE)
    c.phi <- ddply(c.phi, c("Term", "cluster") , summarise, Freq3 = sum(Freq2))
    names(c.phi) <- sub("cluster", "Category", names(c.phi))
    all.df <- merge(all.df, c.phi, all.x = TRUE, sort = FALSE)
    all.df$Freq[!is.na(all.df$Freq2)] <- all.df$Freq2[!is.na(all.df$Freq2)]
    all.df$Freq[!is.na(all.df$Freq3)] <- all.df$Freq3[!is.na(all.df$Freq3)]
    all.df <- all.df[, -grep("Freq[0-9]", names(all.df))]
    # Infer the occurences within topic/cluster
    all.df$Freq <- all.df$Total * all.df$Freq
    
    # P(T|w) -- as a percentage -- for each possible term
    t.w2 <- data.frame(1e8*t.w[keep, ], Term = vocab[keep])
    topic.table <- reshape2::melt(t.w2, id.vars = "Term", variable.name = "Topic", value.name = "Freq")
    
    return(list(mdsDat = mds.df, mdsDat2 = topic.table, barDat = all.df, 
                centers = centers, nClust = input$kmeans))
  })
  
})
