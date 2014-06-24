#' Run shiny/D3 visualization
#' 
#' This function calls \link{shiny::shinyApp} to serve the visualization.
#' As a result, this will prompt a browser in a interactive session or can
#' be used to embed the visualization inline in a R markdown document.
#' 
#' @param phi a matrix with W rows, one for each term in the vocabulary, and K 
#' columns, one for each topic, where each column sums to one. Each column is the 
#' multinomial distribution over terms for a given topic in an LDA topic model.
#' @param term.frequency an integer vector of length W containing the frequency 
#' of each term in the vocabulary.
#' @param vocab a character vector of length W containing the unique terms in 
#' the corpus.
#' @param topic.proportion a numeric vector of length K containing the proportion
#'  of each topic in the corpus.
#'  
#' @seealso \link{check.inputs}
#' @export
#' @examples
#' 
#' # Example using AP documents from 
#' # http://www.cs.princeton.edu/~blei/lda-c/ap.tgz
#' data("APdata", package = "LDAvis")
#' 
#' # Check the coherence of the input data using the function 'check.inputs()'
#' z <- with(APdata, check.inputs(K = 40, W = 10473, phi, term.frequency, 
#'                                vocab, topic.proportion))
#' # Now run the visualization
#' with(z, runShiny(phi, term.frequency, vocab, topic.proportion))
#' 
#' # Example using Newsgroup documents from 
#' # http://qwone.com/~jason/20Newsgroups/
#' data("Newsgroupdata", package = "LDAvis")
#' z <- with(Newsgroupdata, check.inputs(K = 50, W = 22524, phi, term.frequency, 
#'                                        vocab, topic.proportion))
#' # Set a seed to ensure k-means produces the same clusters everytime 
#' set.seed(333)
#' with(z, runShiny(phi, term.frequency, vocab, topic.proportion))
#'



runShiny <- function(phi, term.frequency, vocab, topic.proportion) {
  
  addResourcePath('assets', system.file('shiny', 'assets', package='LDAvis'))
  
  shinyApp(
    
    ui = shinyUI(bootstrapPage(
      
      tags$head(
        tags$script(src = "assets/d3.v3.js"),
        tags$script(src ="assets/topicz.js"),
        tags$link(rel = 'stylesheet', type = 'text/css', href = 'assets/topicz.css')
      ),
      
      inputPanel(
        selectInput("distance", "Topical Distance Calculation", choices = c("Jensen-Shannon" = "JS", 
                                                                            "Symmetric Kullback-Leibler" = "KL")),
        selectInput("scaling", "Multidimensional Scaling Method", choices = c("Classical (PCA)" = "PCA", 
                                                                              "Kruskal's Non-Metric" = "kruskal",
                                                                              "Sammon's Non-Linear Mapping" = "sammon")),
        sliderInput("kmeans", "Number of clusters", min = 1, max = 10, value = 1, width = "125px"),
        sliderInput("nTerms", "Number of terms", min = 1, max = 50, value = 30, width = "125px"),
        sliderInput("lambda", "Value of lambda", min = 0, max = 1, value = 0.6, width = "200px")
      ),
      
      #the el parameter in the js code selects the outputIds
      mainPanel(HTML("<div id=\"mdsDat\" class=\"shiny-scatter-output\"><svg /></div>"))
    )),
    
    server = function(input, output) {
      # Set the values of a few parameters related to the size of the data set:
      K <- length(topic.proportion)  # number of topics
      W <- length(vocab)             # size of vocabulary
      N <- sum(term.frequency)      # total number of tokens in the data
      # This is necessary for subsetting data upon selection in topicz.js
      colnames(phi) <- paste0("Topic", 1:K)
      rel.freq <- term.frequency/N
      
      # compute the token-topic occurrence table:
      phi.freq <- t(t(phi) * topic.proportion * N)

      # Compute distance matrix between topics 
      # We wrap this in its own reactive function so that it isn't recomputed if say the value of lambda changes
      computeDist <- reactive({
        
        d <- proxy::dist(t(phi), method = distance(measure = input$distance))
        # Multidimensional scaling to project the distance matrix onto two dimensions for the vis:
        # Maybe we should explore including options for different scaling algorithms???
        switch(input$scaling,
               PCA = fit <- stats::cmdscale(d, k = 2),
               kruskal = fit <- MASS::isoMDS(d, k = 2)$points,
               sammon = fit <- MASS::sammon(d, k = 2)$points
        )
        x <- fit[, 1]
        y <- fit[, 2]
        # collect the (x, y) locations of the topics and their overall proportions in a data.frame:
        mds.df <- data.frame(topics=1:K, x=fit[, 1], y=fit[, 2], Freq=topic.proportion*100)
        list(mds.df = mds.df, x = x, y = y)
      })
      
      fitCluster <- reactive({
        # Bring in the necessary clustering data
        distDat <- computeDist()
        # workaround errors if no clustering is done (ie, input$kmeans == 1)
        distDat$mds.df$cluster <- 1
        centers <- data.frame(x = 0, y = 0)
        if (input$kmeans > 1) { # and clustering info (if relevant)
          cl <- stats::kmeans(cbind(x=distDat$x, y=distDat$y), input$kmeans)
          distDat$mds.df$cluster <- factor(cl$cluster)
          centers <- data.frame(cl$centers)
        }
        list(mds.df = distDat$mds.df, x = distDat$x, y = distDat$y, centers=centers)
      })
      
      output$mdsDat <- reactive({
        ##############################################################################
        ### Create a df with the info neccessary to make the default OR new bar chart when selecting a topic or cluster.
        ### This functionality requires that we keep track of the top input$nTerms within each cluster and topic (as well as overall).
        ### The ranking of words under a topic is done via a weighted average of the lift and probability of the word given the topic.
        ### The ranking of words under a cluster is done via a similar weighted average (summing over the relevant topics)
        dat <- fitCluster()
        mds.df <- dat$mds.df
        x <- dat$x
        y <- dat$y 
        centers <- dat$centers
        #get the top terms for each topic
        nTermseq <- 1:input$nTerms
        weight <- input$lambda*log(phi) + (1 - input$lambda)*log(phi/rel.freq) 
        top.terms <- NULL
        for (i in 1:K) {
          weights <- weight[, i]
          o <- order(weights, decreasing=TRUE)
          terms <- vocab[o][nTermseq]
          top.terms <- c(top.terms, terms)
        }
        # We need this labeling or else topicz.js will not subset correctly...
        term.labs <- rep(paste0("Topic", 1:K), each = input$nTerms)    
        topic.df <- data.frame(Term = top.terms, Category = term.labs, stringsAsFactors = FALSE)
        
        # get the top terms for each cluster
        clust.terms <- NULL
        if (input$kmeans == 1) {
          #if no clustering is done, we don't want to change the 'most informative words' upon hover
          clust.terms <- terms
        } else {
          for (i in 1:input$kmeans) {
            #grab topics that belong to the current cluster
            topicz <- mds.df$cluster %in% i
            sub.phi <- phi[, topicz]
            #only sum if multiple columns exist
            if (!is.null(dim(sub.phi))) {
              sub.phi <- apply(t(sub.phi)*topic.proportion[topicz], 2, sum)  # weighted by topic term frequency
            }
            weight <- input$lambda*log(sub.phi) + (1 - input$lambda)*log(sub.phi/rel.freq)
            o <- order(weight, decreasing=TRUE)
            terms <- vocab[o][nTermseq]
            clust.terms <- c(clust.terms, terms)
          } 
        }
        term.labs <- rep(paste0("Cluster", 1:input$kmeans), each = input$nTerms)
        clust.df <- data.frame(Term = clust.terms, Category = term.labs, stringsAsFactors = FALSE)
        
        # compute the distinctiveness and saliency of the tokens:
        #t.w <- t(topic.proportion * t(phi))/rel.freq  # P(T|w) = P(T)*P(w|T)/P(w) 
        t.w <- phi/apply(phi, 1, sum)
        t.w.t <- t(t.w)           # Change dimensions from W x K to K x W
        kernel <- t.w.t * log(t.w.t/topic.proportion)
        saliency <- term.frequency * colSums(kernel)
        
        # By default, order the terms by saliency:
        salient <- vocab[order(saliency, decreasing = TRUE)][nTermseq]
        top.df <- data.frame(Term = salient, Category = "Default")
        
        # put together the most salient words with the top words for each topic/cluster
        all.df <- rbind(topic.df, clust.df, top.df)
        # Overall frequency for each possible word
        all.df$Total <- term.frequency[match(all.df$Term, vocab)]
        # Initiate topic/cluster specific frequencies with 0 since that is used for the 'default' category
        all.df$Freq <- 0
        
        # Collect P(w|T) for each possible word
        all.words <- unique(all.df$Term)
        keep <- vocab %in% all.words
        phi2 <- data.frame(phi.freq[keep, ], Term = vocab[keep])    
        t.phi <- reshape2::melt(phi2, id.vars = "Term", variable.name = "Category", value.name = "Freq2")
        all.df <- plyr::join(all.df, t.phi)
        
        # Collect P(w|Cluster) for each possible word
        c.phi <- plyr::join(t.phi, data.frame(Category = paste0("Topic", mds.df$topics), cluster = paste0("Cluster", mds.df$cluster)))
        c.phi <- plyr::ddply(c.phi, c("Term", "cluster") , plyr::summarise, Freq3 = sum(Freq2))
        names(c.phi) <- sub("cluster", "Category", names(c.phi))
        all.df <- plyr::join(all.df, c.phi)
        all.df$Freq[!is.na(all.df$Freq2)] <- all.df$Freq2[!is.na(all.df$Freq2)]
        all.df$Freq[!is.na(all.df$Freq3)] <- all.df$Freq3[!is.na(all.df$Freq3)]
        all.df <- all.df[, -grep("Freq[0-9]", names(all.df))]
        
        # Infer the occurences within topic/cluster
        #all.df$Freq <- all.df$Total * all.df$Freq
        
        # P(T|w) -- as a percentage -- for each possible term
        t.w2 <- data.frame(100*t.w[keep, ], Term = vocab[keep])
        topic.table <- reshape2::melt(t.w2, id.vars = "Term", variable.name = "Topic", value.name = "Freq")   
        kmeans <- input$kmeans
        return(list(mdsDat = mds.df, mdsDat2 = topic.table, barDat = all.df, 
            centers = centers, nClust = kmeans))
      })
    },
    options = list(height = 850, width = 1000)
  )
  
}
