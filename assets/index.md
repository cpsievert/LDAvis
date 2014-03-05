Visualization documentation
----------------------------------------------------

This tab helps document and demonstrate the capabilities of the interactive visualization on the 'Overview' tab. The visualization allows one to survey and filter the usually massive distributions derived from a Latent Dirichlet Allocation (LDA) model. The interactive features are designed to achieve a high level understanding of topic meaning by focusing on the most important words for each topic (and each cluster of similar topics).

### Scatterplot

One of the two main components in the visualization is a scatterplot representing the proximity of topics. The distances between topics are computed via a symmetric version of Kullback-Leibler divergence. Multi-Dimensional Scaling (MDS) is then applied to the distance matrix to obtain a two-dimensional approximation to these distances. By default, the size of each circle represents the proportion of (all non-unique) words that were assigned to that topic. However, the interpretation of the circle size changes to a conditional proportion when we hover over a particular word on the bar chart to the right. The screenshots below show the conditional distributions of topics given "prices" (on the left) and "market" (on the right). Clearly, these words occur in a group of similar topics.

<img src='assets/prices.png' style="display:inline-block; margin-left:auto; margin-right:auto; height:350px;"/>
<img src='assets/market.png' style="display:inline-block; margin-left:auto; margin-right:auto; height:350px;"/>

Extending this idea of topics falling into regions of the scatterplot with similar meaning, we can cluster topics into a certain number of groups. This is especially useful for obtaining a high level understanding of a model with a large number of topics. The clustering is done by simply increasing the value of the "Number of Clusters" slider option. This will trigger a $k$-means algorithm on the scaled distances to guarantee contiguous regions for the Voronoi diagram drawn to indicate clusters of topics. Note that there is randomness involved with the $k$-means algorithm, so cluster regions are not guaranteed to always be the same for a given $k$.

<img src='assets/clusters.png' style="display:inline-block; margin-left:auto; margin-right:auto; height:400px;"/>

### Bar chart

#### Default View

The other main component in the visualization is a bar chart with the most "important" keywords and their corresponding frequencies given the current state. By default, the most important keywords are defined by a measure of *saliency* <a href="http://vis.stanford.edu/papers/termite">(Chuang, Heer, Manning 2012)</a>.

*Saliency* is a compromise between a word's overall frequency and it's *distinctiveness*. A word's *distinctiveness* is a measure of that word's distribution over topics (relative to the marginal distribution over topics). A word is highly distinctive if that word's mass is concentrated on a small number of topics. Very obscure (or rare) words are usually highly distinctive which is why the overall frequency of the word is incorporated in the weight. 

For example, on the y-axis of the bar chart on the Overview tab, we see the words "gorbachev" and "last". Last is not very distinctive (it appears in many different topics), but it is still salient since it has such a high overall frequency. On the other hand, gorbachev does not have a very high overall frequency, but is highly distinctive since it appears almost solely in topic 17 The changing in the size of the circles below reflects the difference in distinctiveness between gorbachev and last.

<img src='assets/gorbachev.png' style="display:inline-block; margin-left:auto; margin-right:auto; height:350px;"/>
<img src='assets/last.png' style="display:inline-block; margin-left:auto; margin-right:auto; height:350px;"/>


#### Conditioning

Our definition of "important" words changes depending on whether the user indicates an interest in a particular cluster or topic. Here we define the *relevance* of a word given a topic as:

$\lambda*log(p(word|topic)) + (1-\lambda)*log(\frac{p(word|topic)}{p(word)})$

The *relevance* of a word given a cluster can also be defined in a similar way:

$\lambda*log(p(word|topic)) + (1-\lambda)*log(\frac{p(word|cluster)}{p(word)})$ 

where $p(word|cluster) = \sum_{topic}p(word|topic)$

Once the top relevant words are chosen, these words are then ordered according to their frequency within the relevant topic/cluster. To keep these relevant words in place on the bar chart, the user must click the desired cluster region or topic circle. To resume to the default plots, click the "clear selection" text above the scatterplot. In the left hand screenshot below, cluster 2 is selected via click, then "soviet" is hovered upon to expose it's conditional distribution over topics. Similarly, on the right hand screenshot, topic 17 is selected via click, then "union" is hovered upon.

<img src='assets/soviet.png' style="display:inline-block; margin-left:auto; margin-right:auto; height:350px;"/>
<img src='assets/union.png' style="display:inline-block; margin-left:auto; margin-right:auto; height:350px;"/>

When a topic is selected, the most relevant documents pertaining to that topic are populated below the scatterplot and bar chart.

<img src='assets/documents.png' style="display:inline-block; margin-left:auto; margin-right:auto; height:350px;"/>


### Upload your own model

By checking the "Upload Data?" option at the top of the page, one can upload up to two local files. The data from a fitted topic model is required while the actual documents are optional. The required file must be a tab-delimited text file with three columns. One column must be named 'tokens' and should have a string of a single word for each row. The other column must be name 'docs' and each row should have one integer corresponding to the document that each tokens belong to. The last column must be named 'topics' and each row should have one integer corresponding to the topic that each token belongs to. The optional file must also be tab-delimited text file with a column for each topic (each named 'TopicX'). The values are assumed be the most representative documents for each topic. See the topdocs function in the ldatools package for details on how to compute representative documents for a topic.

### Contribute

The version of the source files to this application can be found [here](https://github.com/kshirley/LDAviz). Feel free to send us a pull request!

### Acknowledgements

This project was made possible by [AT&T's summer research internship](http://www.research.att.com/internships). The author, [Carson Sievert](http://cpsievert.github.io/), would like to thank [Kenny Shirley](http://www2.research.att.com/~kshirley/) in particular for his guidance and patience. Other people who were important to this project include: [Carlos Scheidegger](http://www.research.att.com/people/Scheidegger_Carlos_E/?fbid=3gzX7Cx1EOz), [Chris Volinsky](http://www2.research.att.com/~volinsky/), [Debby Swayne](http://www.research.att.com/people/Swayne_Deborah_F/index.html?fbid=3gzX7Cx1EOz) and [Simon Urbanek](http://urbanek.info/).
