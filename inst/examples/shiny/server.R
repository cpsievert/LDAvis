library(LDAvis)
library(shiny)
shinyServer(function(input, output, session) {
  output$myChart <- renderVis({
    with(TwentyNewsgroups,
         createJSON(phi, theta, doc.length, vocab, term.frequency,
                    R = input$nTerms))
  })

  output$termClicked <- renderPrint({
    if (is.null(input$myChart_term_click)) return()
    paste("You clicked on term:", input$myChart_term_click)    
  })
  
  output$topicClicked <- renderPrint({
    if (is.null(input$myChart_topic_click)) return()
    paste("You clicked on topic:", input$myChart_topic_click)    
  })
})
