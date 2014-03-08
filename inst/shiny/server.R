library(shiny)
library(proxy)
library(reshape)

options(shiny.maxRequestSize = 100*1024^2) #change default file upload size from 5MB to 100MB

KL <- function(x, y) { #compute Kullback-Leibler divergence
  .5*sum(x*log(x/y)) + .5*sum(y*log(y/x))
}

# Note this function assumes 'phi', 'vocab', and 'freq' exist in the global environment
# Also, the rows of phi (tokens) should already be sorted in decreasing order based on overall frequency

shinyServer(function(input, output) {
  
  output$mdsDat <- reactive({
    k <- min(dim(phi)) # number of topics
    # Compute distance matrix between topics, 
    # set cutoff at cumulative marginal prob of 0.8 (aiming for a so-called "80-20 rule")... 
    rel.freq <- freq/sum(freq)
    d <- dist(t(phi[seq_len(min(which(cumsum(rel.freq) > 0.80))), ]), method = KL)
    fit <- cmdscale(d, k=2)
    x <- fit[,1]
    y <- fit[,2]
    lab <- gsub("Topic", "", names(x))
    loc.df <- data.frame(x, y, topics=lab, stringsAsFactors=FALSE)
    
    # Compute the marginal topic frequency and join with 
    pT <- colSums(phi*freq)
    topics.df <- data.frame(topics = colnames(phi), Freq = pT)
    mds.df <- merge(loc.df, topics.df, by="topics", all.x = TRUE)
    
    # workaround errors if no clustering is done (ie, input$kmeans == 1)
    mds.df$cluster <- 1
    centers <- data.frame(x=0, y=0)
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
    
    #phi.t <- t(phi.hat)
    #pws <- as.numeric(pw[rownames(phi.t)]) # reorder frequencies to match the ordering of phi
    # although I think using getProbs() prevents us from having to worry about re-ordered columns of phi
    weight <- input$lambda*log(phi) + (1-input$lambda)*log(phi/freq) 
    
    #get the top terms for each topic
    top.terms <- NULL
    for (i in seq_len(k)) {
      weights <- weight[,i]
      o <- order(weights, decreasing=TRUE)
      terms <- vocab[o][1:input$nTerms]
      top.terms <- c(top.terms, terms)
    }
    #should we the colnames of phi here? I have a feeling changing term.labs will break some JS...
    term.labs <- rep(paste0("Topic", 1:k), each=input$nTerms)
    topic.df <- data.frame(Term=top.terms, Category=term.labs, stringsAsFactors=FALSE)
    
    # get the top terms and top documents for each cluster
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
        weight <- input$lambda*log(sub.phi) + (1-input$lambda)*log(sub.phi/pws)
        o <- order(weight, decreasing=TRUE)
        terms <- vocab[o][1:input$nTerms]
        clust.terms <- c(clust.terms, terms)
      } 
    }
    term.labs <- rep(paste0("Cluster", 1:input$kmeans), each=input$nTerms)
    clust.df <- data.frame(Term=clust.terms, Category=term.labs, stringsAsFactors=FALSE)
    
    # compute the distinctiveness and saliency of the tokens:
    t.w <- pT*phi/freq  #P(T|w) = P(T)*P(w|T)/P(w) 
    kernel <- t.w*log(t.w/as.vector(pT))
    saliency <- freq*rowSums(kernel)
    # By default, order the terms by saliency:
    top.df <- data.frame(Term = vocab[order(saliency, decreasing = TRUE)][1:input$nTerms], Category = "Default")
    
    # put together the most salient words with the top words for each topic/cluster
    all.df <- rbind(topic.df, clust.df, top.df)
    all.df$Freq <- 0
    
    #next, we find the distribution over topics/clusters for each possible word
    all.words <- unique(all.df$Term)
    phi2 <- phi[vocab %in% all.words, ]
    
#     all.frame <- subset(framed, tokens %in% all.words)
#     counts <- table(as.character(all.frame$tokens), all.frame$topics)
#     counts2 <- table(as.character(all.frame$tokens), all.frame$cluster)
#     
#     for (i in 1:k) {
#       idx <- which(all.df$Category == paste0("Topic", i))
#       all.df$Freq[idx] <- counts[all.df$Term[idx], i]
#     }
#     
#     for (i in 1:input$kmeans) {
#       idx <- which(all.df$Category == paste0("Cluster", i))
#       all.df$Freq[idx] <- counts2[all.df$Term[idx], i]
#     }
#     
#     totals <- table(as.character(all.frame$tokens))
#     idx <- which(all.df$Category == "Default")
#     all.df$Freq[idx] <- totals[all.df$Term[idx]]
#     all.df$Total <- as.integer(totals[all.df$Term])
#     
#     #relative frequency (in percentages) over topics for each possible term
#     #probs <- t(apply(counts, 1, function(x) as.integer(100*x/sum(x))))
#     probs <- t(apply(counts, 1, function(x) round(100*x/sum(x))))
#     # round() gets closer to 100, although sometimes over
#     topic.probs <- data.frame(probs, stringsAsFactors=FALSE)
#     topic.probs$Term <- rownames(probs)
#     topic.table <- data.frame(Term = rep(rownames(probs), k), Topic=rep(1:k, each=length(all.words)),
#                               Freq = as.numeric(as.matrix(topic.probs[, 1:k])))
#     return(list(mdsDat=mds.df, mdsDat2=topic.table, barDat=all.df, docDat=doc.df,
#                 centers=centers, nClust=input$kmeans))
  })
  
  output$dat <- renderText({
    #treat me like your R console!
  })
  
})
