library(LDAvis)
library(shiny)
shinyServer(function(input, output, session) {
  output$myChart <- renderVis({
    with(TwentyNewsgroups,
         createJSON(phi, theta, doc.length, vocab, term.frequency,
                    R = input$nTerms))})

  output$termClicked <- renderPrint({
    if (is.null(input$ldavis_term_clicked)) return()
    paste("You clicked on term:", input$ldavis_term_clicked)    
  })
  output$topicClicked <- renderPrint({
    if (is.null(input$ldavis_topic_clicked)) return()
    paste("You clicked on topic:", input$ldavis_topic_clicked)    
  })

})
