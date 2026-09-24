



This Project Documentation is Submitted in Partial Fulfilment for the Requirements for the Degree of B.Sc. 
In information technology
Safe Kids Guard: An AI-Based System for Detecting and Filtering Inappropriate Arabic Content
 
Prepared by:
Alanoud Mohammed
Shahd Aljahdali
Aseel Albeshry
Supervised by:
Dr. Faria'a Al-Bashir
Academic Year 1447 (2026)
 
 Abstract
This project presents the design and development of a Child Protection Application aimed at ensuring a safe digital environment for children. With the rapid increase in internet accessibility, children are increasingly exposed to inappropriate, harmful, and unsafe online content. The primary goal of this system is to detect, filter, and prevent access to such content using intelligent and automated techniques.
The proposed solution integrates artificial intelligence-based content analysis to classify and block unsafe text, images, and video content in real time. In addition, the system provides a parental control module that enables guardians to monitor device usage, manage screen time, and receive alerts about suspicious or risky activities. The application is designed to be efficient, responsive, and suitable for deployment on mobile platforms.
The methodology combines machine learning models with rule-based filtering to enhance accuracy and reduce false detections. Data processing techniques are applied to ensure reliable content classification, while a user-friendly interface allows parents to easily manage and supervise their children’s digital activities.
The expected outcome of this project is a robust and scalable system that improves child online safety by reducing exposure to harmful content and increasing parental awareness and control. Ultimately, the system contributes to promoting responsible and secure internet usage for children in the digital age.
 
 Table of Contents
Abstract	i
Table of Contents	ii
General Introduction	vii
CHAPTER  1 : Project Identification	2
1.1 Introduction	2
1.2 Scope of Work	2
1.3 Problem Statement	3
1.4 Objectives	3
1.5 Conclusion	3
CHAPTER  2 : Study review	5
2.1 Introduction	5
2.2 Background	5
2.3 Existing Works	6
2.3.1 Bark – AI-Based Parental Control System	6
2.3.2 Qustodio Parental Control System	8
2.3.3 Hithnawi et al. (2025): AraBERT Cyberbullying Detector	9
2.3.4 Alsuwaylimi & Alenezi (2025): Hybrid Arabic Transformers	10
2.3.5 KidsNanny-Parental Control Application	11
2.3.6 Comparison of Systems	12
2.4 Recommendations	13
2.5 Project Methodology	13
2.6 Conclusion	15
CHAPTER  3 : Requirement Determination	17
3.1 Introduction	17
3.2 Requirements Elicitation Technique	17
3.2.1 Questionnaire Analysis	17
3.2.2 Literature Review	29
3.3 Functional and non-functional requirements	29
3.3.1 Functional Requirements	29
3.3.2 Non-Functional Requirements	31
3.4 Conclusion	32
CHAPTER  4 : Use case Analysis	33
4.1 Introduction	33
4.2 Elements of a Use Case	33
4.3 Use Case Diagrams	33
4.3.1 Admin Use Case Diagram	35
4.3.2 Child Use Case Diagram	36
4.3.3 Parent Use Case Diagram	37
4.4 Use Case Description	37
4.5 Conclusion	40
CHAPTER  5 : Conclusion and Future Work	41
5.1 Conclusion	41
5.2 Future Work	42
References	43

 
LIST OF FIGURES
Figure ‎2.3.1:Bark Application	6
Figure ‎2.3.2:BarK GUI	7
Figure ‎2.3.3:Qustodio Parental Control App	8
Figure ‎2.3.4:Qustodio GUI	9
Figure ‎2.3.5:KidsNanny Application	11
Figure ‎2.3.6:KidsNanny GUI	12
Figure ‎2.5.1:Agile Software Development Cycle	14
Figure ‎3.2.1:Question 1	18
Figure ‎3.2.2:Question 2	18
Figure ‎3.2.3:Question 3	19
Figure ‎3.2.4:Question 4	19
Figure ‎3.2.5:Question 5	20
Figure ‎3.2.6:Question 6	20
Figure ‎3.2.7:Question 7	21
Figure ‎3.2.8:Question8	21
Figure ‎3.2.9:Question 9	22
Figure ‎3.2.10:Question 10	22
Figure ‎3.2.11:Question 11	23
Figure ‎3.2.12:Question 12	23
Figure ‎3.2.13:Question 13	24
Figure ‎3.2.14:Question 14	24
Figure ‎3.2.15:Question 15	25
Figure ‎3.2.16:Question 16	25
Figure ‎3.2.17:Question 17	26
Figure ‎3.2.18:Question 18	27
Figure ‎3.2.19:Question 19	28
Figure ‎4.3.1: Safe Kids Guard System Use Case Diagram	34
Figure ‎4.3.2:Admin Use Case Diagram	35
Figure ‎4.3.3:Child Use Case Diagram	36
Figure ‎4.3.4:Parent Use Case Diagram	37










 
LIST OF TABLES
Table ‎2.3.1:Comparison of Systems	12
Table ‎2.4.1:Comparison between existing applications and the proposed application	13
Table ‎4.4.1:Login Use Case Description	37
Table ‎4.4.2:Register Account Use Case Description	38
Table ‎4.4.3:Access Online Content Use Case Description	38
Table ‎4.4.4:AI Analyze Content Use Case Description	38
Table ‎4.4.5:Configure Filtering & Policies Use Case Description	39
Table ‎4.4.6:Name Monitor Activity Dashboard Use Case Description	39







 
 General Introduction
The widespread adoption of the internet and digital technologies has significantly transformed the way children access information, communicate, and learn. While this digital environment offers substantial educational and social benefits, it also exposes children to various risks, including inappropriate, harmful, or unsafe content. Such exposure may negatively affect their psychological development, behavior, and overall well-being.
Existing content filtering and parental control solutions often rely on basic rule-based or keyword-matching techniques, which are insufficient for understanding the context and meaning of modern online content. These limitations become more pronounced in multilingual environments, particularly for Arabic language content, where natural language processing support is still evolving compared to other languages.
In response to these challenges, this project proposes the development of an intelligent child protection system powered by Artificial Intelligence (AI) and Natural Language Processing (NLP). The system is designed to analyze and classify online textual content in real time, identifying harmful or inappropriate material with improved contextual understanding and accuracy.
By integrating machine learning models with real-time filtering mechanisms and parental monitoring tools, the proposed solution aims to provide a more adaptive, accurate, and privacy-aware approach to protecting children in digital spaces.








 











Part 1: Planning Phase





 
CHAPTER  1 : Project Identification
1.1 Introduction
Children today spend substantial time online for education and entertainment, but global surveys show alarming rates of exposure to harmful content. For example, Australia’s eSafety Commission found that 53% of children (age 10–17) experienced cyberbullying and 74% had encountered “content associated with harm” [1]. Harmful content includes violent or sexual media, hate speech, cyberbullying, grooming, and other forms of abuse. Such exposures can lead to psychological trauma, social isolation, and early sexualization. The risks are compounded by anonymity and disinhibition online, which enable predators and bullies to target young users persistently [2].
A critical challenge is language. The Arabic language, with over 270 million speakers globally [3], is under-served by content-filtering technologies. Modern Arabic is written in a complex script with rich morphology and many dialects, so general NLP models often fail to understand it fully [2][4]. Recent research notes that most cyberbullying and harassment detection has focused on English, leaving a “substantial gap” for Arabic text [4]. Even tools that use AI (e.g. Bark or Qustodio) typically analyze English or major European languages [5][6]. In practice, parents of Arabic-speaking children must rely on blunt category filters or manual supervision.
This project aims to fill that gap by developing an AI-based application that monitors and filters online content for children, with an emphasis on Arabic NLP. Our system will use state-of-the-art Arabic text analysis (e.g. transformer models like AraBERT) to flag violent, sexual, hateful or otherwise inappropriate material in real-time. Parents will receive alerts and reports through a user-friendly dashboard. The design will ensure privacy by analyzing data on-device where possible.
1.2 Scope of Work
The scope of this project includes the design and development of an AI-based application capable of detecting and filtering inappropriate online content targeted at children. The system focuses primarily on text-based content analysis. The main components of the system include:
•	Real-time text content analysis and classification.
•	Machine learning-based detection of harmful content.
•	A reporting system for parents or guardians.
•	A user-friendly interface for monitoring and control.
•	Integration with NLP models optimized for Arabic language processing.
The project will be implemented as a prototype system that demonstrates the feasibility of intelligent child protection using AI technologies.
1.3 Problem Statement
Children today are highly active on digital platforms, where they may encounter harmful or inappropriate content without supervision. Despite the availability of digital safety tools, many existing solutions are limited in their ability to effectively detect and filter inappropriate content, particularly in Arabic. These systems often rely on static keyword-based filtering, which lacks contextual understanding and leads to inaccurate results.
As a result, children remain vulnerable to exposure to harmful content while using digital platforms. There is a strong need for an intelligent, adaptive system that can understand context, process Arabic language efficiently, and provide accurate real-time filtering with minimal false positives and negatives.
1.4 Objectives
The main goal of this project is to develop an AI-based system that enhances child online safety by detecting and filtering inappropriate Arabic content. The main objectives of this project are as follows:
•	To design and develop an AI-based system for detecting inappropriate online content.
•	To implement a real-time content filtering mechanism using machine learning techniques.
•	To improve Arabic language processing for better classification accuracy.
•	To provide a monitoring dashboard for parents or guardians.
•	To ensure privacy, safety, and efficient performance of the system.
•	To reduce children's exposure to harmful online material through intelligent filtering.
1.5 Conclusion
This chapter introduced the project within the context of Saudi Arabia, highlighting the increasing need for child online safety solutions in a rapidly digitalizing society. It outlined the scope of work, identified key challenges in Arabic content moderation, and defined the primary objectives of the proposed system.
The project is aligned with the broader goals of improving digital safety and supporting family-oriented technology development in Saudi Arabia. This project reflects innovation and technological advancement in line with Saudi Vision 2030, and it is a step toward achieving an advanced digital future.
 
CHAPTER  2 : Study review
2.1 Introduction
This chapter presents a review of existing research and systems related to child online protection and harmful content detection. It begins by discussing the background of the domain, followed by an analysis of existing works and solutions. The chapter then highlights the strengths and limitations of current approaches and concludes with recommendations and the methodology adopted in this project.
2.2 Background
The increasing use of digital platforms by children has created a growing need for effective online safety mechanisms. Traditional parental control systems primarily rely on static filtering techniques such as keyword blocking, URL blacklists, and predefined category restrictions. While these methods provide a basic level of protection, they lack contextual understanding and often fail to detect modern, evolving forms of harmful content.
Recent advancements in Artificial Intelligence (AI) and Natural Language Processing (NLP) have introduced more intelligent approaches to content moderation. Machine learning models, especially transformer-based architectures such as BERT and its Arabic variants (e.g., AraBERT), have significantly improved text classification tasks. These technologies enable systems to understand semantic meaning rather than relying solely on keywords, making them more suitable for detecting subtle or context-dependent harmful content.
However, despite these advancements, Arabic-language content moderation remains underdeveloped compared to English. The linguistic complexity of Arabic, including dialect variation and rich morphology, continues to present challenges for existing systems.
 
2.3 Existing Works
2.3.1 Bark – AI-Based Parental Control System
Bark is a widely used parental control application that monitors children’s online activities, including text messages, emails, and social media interactions. It uses machine learning algorithms to detect signs of cyberbullying, inappropriate content, and online predators[5].
Advantages
•	Uses AI-based detection rather than simple keyword filtering
•	Covers multiple communication platforms (SMS, email, social media)
•	Sends real-time alerts to parents
•	Offers broad monitoring features including screen time control
Disadvantages
•	Limited support for Arabic and other non-English languages
•	Cloud-based processing raises privacy concerns
•	Requires subscription for full functionality
•	Detection accuracy varies depending on context and platform
 
Figure ‎2.3.1:Bark Application

      
Figure ‎2.3.2:BarK GUI
 
2.3.2 Qustodio Parental Control System
Qustodio is a cross-platform parental control and digital wellbeing mobile app used to manage children’s device use and online safety. It lets caregivers filter content, set screen-time limits, track location, and monitor activity across phones, tablets, and computers. The service is used by millions of families and is also offered in versions for schools [6].
Advantages:
•	Provides comprehensive parental control features (screen time, app blocking, and web filtering).
•	Easy-to-use dashboard for parents.
•	Supports multiple devices and operating systems.
•	Offers real-time activity reports.
Disadvantages:
•	Relies heavily on rule-based filtering rather than deep contextual understanding.
•	Limited effectiveness in detecting nuanced or context-based harmful content.
•	Weak support for Arabic NLP and dialect variations.
•	Some advanced features are locked behind premium plans.
 
Figure ‎2.3.3:Qustodio Parental Control App

     
Figure ‎2.3.4:Qustodio GUI
2.3.3 Hithnawi et al. (2025): AraBERT Cyberbullying Detector
Hithnawi et al. (2025) present an academic study applying the AraBERTv2 transformer model to detect Arabic cyberbullying in Facebook comments. This directly addresses our focus on Arabic textual harms. The authors collected and annotated a large corpus of Arabic comments to build their detector [2].
Architecture/Approach: They fine-tuned AraBERTv2 on labeled data. Experiments varied how many layers of AraBERT to unfreeze during fine-tuning. The final model tuned all layers for best performance.
Dataset: Starting from a pool of >40,000 raw comments, they filtered and manually annotated 20,000 comments into “bullying” (10,246 examples) or not. Comments spanned MSA and dialect. Annotation was careful to include insults, harassment, threats, etc. The resulting dataset was balanced.
Performance: With full fine-tuning, the AraBERT model achieved 91.9% accuracy and F1 = 92.8% on held-out test data. (Freezing all but final layer gave ~81.7% accuracy; unfreezing all layers gave the 91.9%.) No other metrics (e.g. recall/precision) are explicitly reported beyond F1.
Advantages: 
•	High accuracy on Arabic text and leveraging a state-of-the-art transformer.
•	 It shows that context-aware NLP (beyond keywords) can succeed on Arabic cyberbullying.
•	AraBERT’s pretrained knowledge of Arabic helped.
Disadvantages: 
•	The solution is heavy: AraBERT models are large (hundreds of MB) and require GPUs to train. 
•	The system was evaluated offline, not in a live “real-time” filter scenario. 
•	It was trained on Facebook comments, so may not generalize to all platforms.
•	 No support for dialect beyond the collected data. 
•	The computational cost may hinder on-device use.
2.3.4 Alsuwaylimi & Alenezi (2025): Hybrid Arabic Transformers
Alsuwaylimi and Alenezi (2025) develop hybrid transformer ensembles for Arabic cyberbullying detection. They introduce two models: (1) CAMeLBERT + AraGPT2 and (2) AraBERT + XLM-RoBERTa, combined via feature fusion and ensemble voting. They also created a new Arabic cyberbullying dataset [4].
Architecture/Approach: Both models are transformer-based. The first concatenates contextual features from CAMeLBERT (morphology-aware Arabic BERT) and AraGPT2 (Arabic generative model). The second combines AraBERT and XLM-R. Fusion of feature vectors and majority voting boosts accuracy. This is a purely textual ML approach.
Dataset: They collected Arabic tweets from X (Twitter), originally 95,512 posts, filtered to 43,122 after initial cleaning, then annotated to 17,670 final examples. Labels were “bullying” vs “non-bullying” (two classes). Three native annotators labeled data. The dataset is imbalanced (more non-bullying).
Performance: The CAMeLBERT+AraGPT2 model achieved 97% accuracy. using feature fusion. (Ensembling further improved robustness.) In context, they note this outperforms single-model baselines and an LSTM/BiLSTM. No per-class F1 is given, but accuracy is very high.
Advantages: 
•	Extremely high reported accuracy suggests this ensemble can capture nuanced Arabic harassment. 
•	Using multiple pretrained models leverages different language characteristics.
Disadvantages: 
•	Resource intensity is the main drawback. 
•	Fine-tuning and running two transformers (let alone two pairs) is very heavy (in memory and CPU). 
•	Their dataset of ~17k tweets is useful but limited to Twitter style, unknown generalization to other domains.
2.3.5 KidsNanny-Parental Control Application
KidsNanny is an AI-powered parental control and digital safety app that helps parents manage children’s screen time and protect them from harmful online content. Available on Android, iOS and other platforms, it combines monitoring, filtering and location tracking in a single dashboard.
Advantages
•	Provides web filtering and safe browsing features
•	Includes monitoring tools for tracking children’s online activities
•	User-friendly interface for parents
•	Supports multiple device management
Disadvantages
•	Primarily rule-based filtering with limited AI capabilities
•	Lacks advanced contextual understanding of content
•	Limited focus on Arabic language processing
 
Figure ‎2.3.5:KidsNanny Application

  
Figure ‎2.3.6:KidsNanny GUI
2.3.6 Comparison of Systems
Table ‎2.3.1:Comparison of Systems
System	Languages	Approach	Deployment	Real-Time	Performance	Year
Bark [5]	English, Spanish, Afrikaans (no Arabic)	Proprietary AI (contextual NLP)	Cloud    (parent’s device cloud)	Yes (alerts)	No public metrics	2023
Qustodio [6]	English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese (no Arabic)	Category filters + some ML alerts	Cloud	Yes (dash alerts)	no public metrics	2023
Hithnawi et al. (2025) [2]	Arabic	Fine-tuned AraBERTv2	Cloud Server	research	91.9% Acc (92.8% F1)	2025
Alsuwaylimi & Alenezi (2025) [4]	Arabic	Hybrid ensemble (CAMeLBERT + AraGPT2, AraBERT + XLM-R)	Cloud	N/A	97% Acc (F1 not reported)	2025
KidsNanny[7]	English only	On-device AI scanner (screen, WhatsApp, camera)	On-device (mobile app)	Yes	Not reported 	2023
2.4 Recommendations
Based on the review of existing systems, several key improvements are necessary for an effective child protection solution:
•	Development of Arabic-focused NLP models for better content understanding
•	Integration of context-aware AI models instead of keyword-based filtering
•	Use of real-time classification systems for instant detection and alerts
•	Implementation of privacy-preserving techniques such as on-device processing
Table ‎2.4.1:Comparison between existing applications and the proposed application
Feature / Criteria	Bark	Qustodio	KidsNanny	Proposed Application
Detection Approach	AI-based + keyword detection	Rule-based filtering	Rule-based filtering	AI-based (ML + NLP)
Real-Time Monitoring	Yes	Limited	Limited	Yes (real-time NLP processing)
Context Understanding	Moderate	Low	Low	High (NLP-based semantic analysis)
Arabic Language Support	No	No	No	Strong (Arabic-focused NLP models)
Parental Dashboard	Yes	Yes	Yes	Yes (enhanced analytics & reporting)
Adaptability / Learning	Moderate	Low	Low	High (machine learning models)
Accuracy	Moderate–High	Moderate	Low–Moderate	High (context-aware classification)
Focus on Arabic Content	No	No	No	Yes (primary focus)
2.5 Project Methodology
The development of the proposed child protection system follows the Agile Software Development methodology, which is an iterative and incremental approach to software engineering. This methodology is selected due to the evolving nature of the system requirements and the need for continuous improvement, especially in an AI-based environment where model performance depends on iterative refinement and feedback.
Agile methodology emphasizes flexibility, collaboration, and continuous delivery of functional components. It is particularly suitable for this project because the system involves both software development and machine learning model integration, which require frequent updates, testing, and optimization.
This approach is supported by the Agile Manifesto, which highlights iterative development, customer feedback, and adaptive planning as core principles of effective software engineering.
Agile Development Process for the Project
The project is implemented through a series of iterative cycles (sprints), where each cycle delivers an improved version of the system. Each iteration includes planning, development, testing, and review.
•	Requirement Analysis: The initial requirements of the system are identified, including real-time content filtering, Arabic language processing, and parental monitoring features. Requirements are refined throughout the development process based on feedback.
•	System Design: A high-level system architecture is design, including the integration of the machine learning model, backend services, and user interface components. Design decisions are revisited and improved across iterations.
•	Implementation (Incremental Development): The system is implementation in small functional modules. Each module (e.g., text classification, alert system, dashboard) is implemented and tested independently before integration.
•	Testing: Each developed module undergoes continuous testing to ensure correctness and performance. Testing includes both software testing and machine learning evaluation using metrics such as accuracy, precision, recall, and F1-score.
•	Deployment and Review: Feedback is collected from system testing and simulated user interaction. This feedback is used to identify weaknesses and improve both system functionality and model performance.
 
Figure ‎2.5.1:Agile Software Development Cycle

2.6 Conclusion
This chapter reviewed existing work related to child online safety systems, content filtering applications, and AI-based monitoring solutions. It highlighted the limitations of current approaches, particularly their reliance on rule-based filtering techniques and their weak support for Arabic language content and contextual understanding.
The analysis of existing systems such as Bark, Qustodio, and KidsNanny showed that while these applications provide useful parental control features, they still lack advanced Natural Language Processing capabilities and struggle to accurately detect harmful content in a contextual and multilingual environment.
To address these limitations, the chapter identified the need for a more intelligent and adaptive solution based on Artificial Intelligence and NLP technologies. It also justified the adoption of the Agile methodology, which supports iterative development, continuous improvement, and adaptability making it suitable for systems that rely on machine learning models.
Overall, this chapter establishes the foundation for the proposed system by identifying the research gap and defining the methodological approach that will guide the design, implementation, and evaluation phases of the project.
 








Part 2: Analysis Phase 


 
CHAPTER  3 : Requirement Determination
3.1 Introduction
This chapter presents the process of requirement determination for the proposed AI-based child protection system (Safe Kids Guard). Requirement determination is a critical phase in system development, as it defines the expected functionality and performance of the system and provides a foundation for design and implementation.
In this project, system requirements were identified through a combination of a comprehensive literature review and an empirical user questionnaire. By analyzing existing research, applications, and technological approaches discussed in Chapter 2, alongside the direct feedback gathered from parents, teachers, and guardians via the questionnaire, a clear and holistic understanding of current limitations, real-world challenges, and specific user needs was established. This dual approach ensures that the proposed system is grounded in validated academic knowledge while directly addressing the practical gaps and expectations highlighted by the target users.
3.2 Requirements Elicitation Technique
To ensure accurate and complete system requirements, several elicitation techniques are used:
3.2.1 Questionnaire Analysis
Questionnaires are distributed to a larger group of users to collect structured data. This technique helps gather opinions about desired features, usability expectations, and common challenges faced with existing parental control systems.
 
Figure 3.2.1 shows the distribution of the participants' roles based on 88 responses. The majority of the respondents identified as Parents, making up 52.3% of the total. The second largest group selected "Other" at 28.4%, followed by Teachers at 11.4%, and finally, Guardians comprising 8% of the participants.
 
Figure ‎3.2.1:Question 1
Figure 3.2.2 shows that out of 88 responses, 88.6% of the participants have children who use the internet or smart devices, while 11.4% do not
 
Figure ‎3.2.2:Question 2
 
Figure 3.2.3 shows the age groups of the participants' children, indicating that the largest segment is aged 6–10 (38.6%), followed by ages 11–15 (28.4%), ages 16–18 (17%), and children Under 6 (15.9%).
 
Figure ‎3.2.3:Question 3
Figure 3.2.4 shows how frequently the participants' children use the internet, highlighting that the majority use it Daily (63.6%), followed by Several times a week (26.1%), and Rarely (10.2%).
 
Figure ‎3.2.4:Question 4
 
Figure 3.2.5 shows the main devices used by the participants' children. The most commonly used devices are Smartphones (56.8%) and Tablets (53.4%), followed by Gaming devices (37.5%) and Laptops/Computers (13.6%).
 
Figure ‎3.2.5:Question 5
Figure 3.2.6 shows the participants' main concerns regarding their children's online activity. The top concern is Exposure to inappropriate content (70.5%), followed closely by Excessive screen time (63.6%). Other significant concerns include Online predators (46.6%), Privacy/security risks (36.4%), and Cyberbullying (29.5%).
 
Figure ‎3.2.6:Question 6

Figure 3.2.7 shows the responses when asked if participants currently use a parental control application, revealing that a vast majority of 85.2% answered "No," while only 14.8% answered "Yes."
 
Figure ‎3.2.7:Question 7
Figure 3.2.8 shows the specific parental control applications used by the 13 respondents who answered "Yes" to the previous question. The most recognized applications mentioned are Family Link (23.1%) and Bark (7.7%), while the remaining responses consist of non-specific answers such as "I don't know," "No," or punctuation marks.
 
Figure ‎3.2.8:Question8
 
Figure 3.2.9 shows the participants' satisfaction levels with existing parental control systems on a scale from 1 to 5. The largest group gave a neutral rating of 3 (35.2%), followed closely by the highest satisfaction rating of 5 (33%). A rating of 4 was selected by 14.8%, while the lower satisfaction ratings of 2 and 1 accounted for 10.2% and 6.8%, respectively.
 
Figure ‎3.2.9:Question 9
Figure 3.2.10 shows the challenges participants have faced with current parental control systems. The most common issue reported is Inaccurate filtering (48.9%), followed by the systems being Difficult to use (37.5%). Other notable challenges include Limited features (30.7%), a Lack of Arabic support (27.3%), Privacy concerns (27.3%), and High cost (20.5%).
 
Figure ‎3.2.10:Question 10

Figure 3.2.11 shows the features participants would like in a child protection system. The most desired feature is Website/app blocking (62.5%), closely followed by AI-based detection of harmful text with Arabic support (59.1%) and Real-time content filtering (58%). Other requested features include Screen time control (50%), Alerts and notifications (43.2%), and Activity reports (26.1%).
 
Figure ‎3.2.11:Question 11
Figure 3.2.12 shows how participants rate the importance of real-time content detection. An overwhelming majority of 88.6% consider it "Very important," followed by 10.2% who find it "Important," with the remaining 1.2% selecting "Neutral."
 
Figure ‎3.2.12:Question 12

Figure 3.2.13 shows how participants rate the importance of Arabic language support in the system. A massive majority of 89.8% consider it "Very important," with the remaining small percentage split between "Important" and "Neutral."
 
Figure ‎3.2.13:Question 13
Figure 3.2.14 shows the participants' preference for on-device processing to ensure better privacy. An overwhelming majority of 92% answered "Yes," while the remaining small fraction of responses is split between "No" and "Not sure."
 
Figure ‎3.2.14:Question 14
 
Figure 3.2.15 shows the participants' expectations regarding how easy the application should be to use. The largest group prefers it to be "Very easy" (38.6%), closely followed by "Easy" (33%) and "Moderate" (26.1%), with only a negligible fraction of users finding a "Complex" interface acceptable.
 
Figure ‎3.2.15:Question 15
Figure 3.2.16 shows how often the participants would check the system dashboard. The largest portion indicated they would check it Daily (36.4%), followed by checking Only when alerted (23.9%). The remaining users were split between checking Weekly (20.5%) and Multiple times daily (19.3%).
 
Figure ‎3.2.16:Question 16
 
Figure 3.2.17 shows the types of notifications participants prefer to receive. A strong majority prefer Instant alerts (72.7%), followed by a Daily summary (29.5%), and finally Weekly reports (11.4%).
 
Figure ‎3.2.17:Question 17
 
Figure 3.2.18 shows a summary of the open-ended responses for Question 18, which asked users to identify the single most important feature they expect from the system. The most dominant theme is effective content blocking and child protection (filtering inappropriate content, ads, and restricting access). Other highly requested features include instant alerts and rapid notifications for real-time monitoring, as well as ease of use, speed, and high accuracy. Additionally, several users emphasized the importance of privacy, strong Arabic language support, and advanced proactive threat detection to stop risks before they happen.
 
Figure ‎3.2.18:Question 18
 
Figure 3.2.19 shows a summary of the final open-ended responses for Question 19, where users shared additional suggestions or concerns. While the majority of participants indicated they had no further comments or simply expressed gratitude for the project, those who provided actionable feedback suggested improving the system's speed, offering fast technical support, and designing a clearer, more user-friendly interface. Additional suggestions included adding interactive tools for children, blocking inappropriate advertisements, ensuring high accuracy with strong privacy and Arabic language support, and implementing a mandatory activity summary to help users realize how much time was spent on the device.
 
Figure ‎3.2.19:Question 19

3.2.2 Literature Review
The literature review served as the main source for eliciting system requirements. It involved analyzing existing parental control systems, AI-based content filtering techniques, and recent research on Arabic Natural Language Processing (NLP).
The review of systems such as Bark, Qustodio, and KidsNanny, along with academic studies on Arabic cyberbullying detection, revealed several important insights:
•	Most existing parental control systems rely on rule-based or keyword-based filtering, which lacks contextual understanding and leads to inaccurate detection.
•	There is limited support for Arabic language processing, particularly in handling dialects and complex linguistic structures.
•	Advanced machine learning models, especially transformer-based architectures (e.g., AraBERT), demonstrate high accuracy in detecting harmful Arabic content.
•	Many systems depend on cloud-based processing, raising concerns about data privacy and security.
•	Existing applications provide monitoring features but lack intelligent real-time content analysis.
These findings highlight a significant gap in current solutions, particularly in combining real-time AI-based filtering, Arabic language support, and privacy-preserving mechanisms.
Based on this analysis, the key requirements of the proposed system were identified to ensure improved performance, usability, and effectiveness compared to existing systems.
3.3 Functional and non-functional requirements
The insights gained from the study review were systematically examined to establish a comprehensive set of system requirements, which are organized into functional and non-functional requirements.
3.3.1 Functional Requirements
The functional requirements are categorized based on the two primary actors of the system: Child and Parent. The system internally manages all processing, monitoring, and control operations.

A.	Child Requirements
These requirements define how the system interacts with the child user and handles their requests:
•	The system shall allow the child to log in using a child account linked to a parent account.
•	The system shall monitor the child’s interaction with online textual content in real time through background processing mechanisms.
•	The system shall analyze and classify content accessed or generated by the child using AI-based natural language processing techniques.
•	The system shall automatically restrict or block access to inappropriate or harmful content without requiring user intervention.
•	The system shall allow the child to access safe content and permitted applications under predefined parental control settings.
•	The system shall enforce usage policies transparently to provide a safe and uninterrupted digital environment.
•	The system shall allow the child to log out securely from the application.
B.	Parent Requirements
These requirements define how the parent manages, monitors, and controls the system:
•	The system shall provide the parent with account management capabilities, including registration, secure login and logout, and the ability to create, manage, and link child accounts for supervision purposes.
•	The system shall provide a dashboard that enables the parent to monitor the child’s online activity and view detected risks.
•	The system shall send real-time alerts and notifications when harmful or suspicious content is detected.
•	The system shall allow the parent to configure filtering levels, specify application restrictions, and define custom usage policies.
•	The system shall generate downloadable or viewable reports summarizing the child’s activity and system interventions over specified time periods.
•	The system shall synchronize the child’s activity data with the parent’s interface in near real-time and enforce parental settings dynamically on the child’s device.
C.	Admin Requirements
These requirements define how the system administrator manages and maintains the system:
•	The system shall allow the admin to log in securely using administrative credentials.
•	The system shall allow the admin to manage user accounts, including viewing, updating, or safely deleting parent and child accounts.
•	The system shall allow the admin to monitor overall system health and activity, including usage statistics, performance metrics, and detected harmful content trends.
•	The system shall allow the admin to manage and update the AI models or core filtering rules to continuously improve detection accuracy for all users.
•	The system shall allow the admin to review reported or flagged content and take appropriate systemic actions (e.g., globally blacklisting a new malicious URL).
•	The system shall allow the admin to manage global system settings and configurations, such as baseline thresholds and system parameters.
3.3.2 Non-Functional Requirements
Non-functional requirements define the quality attributes and operational constraints of the system:
•	Performance: The system must process and classify content in real time with minimal latency.
•	Accuracy: The system should achieve high classification accuracy, minimizing false positives and false negatives.
•	Usability: The system interface must be intuitive and easy to use for parents and guardians.
•	Security and Privacy: The system must ensure secure handling of user data, with emphasis on privacy-preserving mechanisms such as on-device processing.
•	Scalability: The system should support future expansion and integration of additional features.
3.4 Conclusion
This chapter presented the requirement determination process based on a comprehensive literature review. By analyzing existing systems and recent research, key limitations and challenges were identified, particularly in relation to Arabic content filtering and contextual understanding.
The derived functional and non-functional requirements define the essential capabilities and quality attributes of the proposed system. These requirements provide a clear and structured foundation for the next phase, which focuses on system modeling using use cases and design techniques.
 
CHAPTER  4 : Use case Analysis
4.1 Introduction
This chapter presents the use case analysis for the proposed AI-based child protection system (Safe Kids Guard). Use case analysis is an essential step in system design, as it describes how users interact with the system to achieve specific goals.
The functional requirements identified in Chapter 3 are translated into use cases, which represent the interactions between system actors and the system. These use cases help in understanding system behavior from the user’s perspective and provide a foundation for system design and implementation.
The system includes three primary actors: Child, Parent, and Admin, each with specific roles and interactions within the system.
4.2 Elements of a Use Case
A use case is a structured description of how an actor interacts with the system. Each use case consists of the following elements:
•	Name: A clear and descriptive title of the use case.
•	Actor: The user (Child, Parent, or Admin) who initiates the interaction.
•	Description: A brief explanation of the purpose of the use case.
•	Pre-condition: Conditions that must be satisfied before the use case begins.
•	Basic Flow: The normal sequence of steps taken to complete the use case.
•	Post-condition: The state of the system after the use case is successfully completed.
These elements ensure consistency and clarity in describing system functionality.
4.3 Use Case Diagrams
The use case diagram provides a visual representation of the interactions between the system and its actors. Actors: Child, Parent, Admin
The diagram illustrates how each actor interacts with the system and highlights relationships between different use cases.
 
Figure ‎4.3.1: Safe Kids Guard System Use Case Diagram
 
4.3.1 Admin Use Case Diagram
 
Figure ‎4.3.2:Admin Use Case Diagram
 
4.3.2 Child Use Case Diagram
 
Figure ‎4.3.3:Child Use Case Diagram
 
4.3.3 Parent Use Case Diagram
 
Figure ‎4.3.4:Parent Use Case Diagram
4.4 Use Case Description
Table ‎4.4.1:Login Use Case Description
Name	Secure Login
Actor	Child, Parent, Admin
Description	The user authenticates themselves to securely access their respective interfaces and features.
Pre-condition	The user must have a previously registered and active account in the system.
Basic Flow	1. User navigates to the login screen.
2. User enters their credentials (e.g., username and password).
3. System validates the credentials against the database.
4. System grants access and redirects to the role-specific dashboard.
Post-Condition	The user is authenticated, and an active session is established.
Table ‎4.4.2:Register Account Use Case Description
Name	Register Account
Actor	Parent
Description	Allows a parent to create a new account in the system.
Pre-condition	User must not already have an account.
Basic Flow	1. Parent enters required information.
2. System validates data.
3. System creates a new account.
Post-condition	Parent account is created and ready for use.

Table ‎4.4.3:Access Online Content Use Case Description
Name	Access Online Content
Actor	Child
Description	The child attempts to browse a website, view media, or access web-based resources.
Pre-condition	The child is logged into their monitored device or account.
Basic Flow	1. Child requests a specific URL or web content.
2. System intercepts the request before it loads.
3. System triggers the "AI Analyze Content" process.
4. AI determines the content is safe.
5. System allows the connection.
6. Content is displayed to the child.
Post-Condition	The child successfully views the requested safe content, and the activity is logged.

Table ‎4.4.4:AI Analyze Content Use Case Description
Name	AI Analyze Content
Actor	System (Internal)
Description	The core logic where the system evaluates requested content in real-time against AI models and parent policies.
Pre-condition	A content or application request has been intercepted by the system.
Basic Flow	1. System extracts metadata and text from the requested content.
2. System compares data against parent-defined policies.
3. System runs content through the AI safety model.
4. AI returns a "Safe" or "Unsafe" verdict.
5. System triggers the appropriate Allow or Block extension.
Post-Condition	The content is categorized, and a definitive Allow or Block action is initiated.

Table ‎4.4.5:Configure Filtering & Policies Use Case Description
Name	Configure Filtering & Policies
Actor	Parent
Description	The parent sets up web filtering levels, application restrictions, and usage policies for a specific child's account.
Pre-condition	The parent is logged into the system and has at least one linked child account.
Basic Flow	1. Parent selects the "Manage Policies" section.
2. Parent selects the specific child account to modify.
3. Parent adjusts sliders or toggles for age restrictions, specific app blocks, or categories.
4. Parent clicks "Save Changes."
5. System applies the new rules dynamically to the child's profile.
Post-Condition	The child's device immediately enforces the newly configured filtering policies.

Table ‎4.4.6:Name Monitor Activity Dashboard Use Case Description
Name	Monitor Activity Dashboard
Actor	Parent
Description	The parent views a summarized overview of the child's recent online activities, including allowed sites and blocked attempts.
Pre-condition	The parent is logged in, and the child's device has synced recent data.
Basic Flow	1. Parent navigates to the "Dashboard" tab.
2. System retrieves the latest synchronized activity data from the database.
3. System renders visual charts, recent activity logs, and highlights any risk alerts.
Post-Condition	The parent successfully reviews the child's digital behavior without altering any system settings.
4.5 Conclusion
This chapter presented the use case analysis of the proposed system by identifying key interactions between the actors (Child, Parent, and Admin) and the system. The use case elements provided a structured approach for describing system behavior, while the use case diagram illustrated the relationships between actors and system functionalities.
The detailed use case descriptions further clarified how the system operates in different scenarios. These use cases serve as a foundation for the next phase, where system architecture and data models will be developed.
 
CHAPTER  5 : Conclusion and Future Work
5.1 Conclusion
This project presented the design and analysis of Safe Kids Guard, an AI-based system developed to enhance children’s online safety by detecting and filtering inappropriate Arabic content in real time. The increasing exposure of children to harmful digital content, combined with the limitations of existing parental control applications, highlighted the need for a more intelligent and context-aware solution.
The study reviewed existing parental control systems and recent research in Arabic Natural Language Processing and content moderation. The analysis demonstrated that most current solutions rely heavily on rule-based filtering and provide limited support for Arabic language processing and contextual understanding. These limitations motivated the development of a system that integrates Artificial Intelligence and NLP techniques to provide more accurate and adaptive protection.
The project successfully defined the functional and non-functional requirements of the system through literature review and requirement analysis. The proposed solution supports three main actors: Child, Parent, and Admin, each with specific functionalities and responsibilities. The system was designed to provide:
•	Real-time content monitoring and filtering.
•	AI-based Arabic text classification.
•	Parent monitoring and reporting tools.
•	Configurable filtering and control policies.
•	Privacy-aware and scalable system architecture.
In addition, the use case analysis clearly described the interaction between users and the system, providing a structured foundation for future system design and implementation phases.
Overall, the project contributes to improving child online safety by proposing an intelligent Arabic-focused protection system capable of understanding contextual harmful content rather than depending solely on static keyword filtering. The proposed system aligns with modern AI-driven digital safety approaches and supports the growing demand for secure digital environments for children.
5.2 Future Work
The current phase of the Safe Kids Guard project focuses mainly on requirement analysis and use case modeling. According to the proposed project plan, several important phases remain to be completed in order to transform the proposed system into a fully functional and deployable application.
Future work will focus on completing the remaining analysis, design, and implementation activities of the system. The next stage will involve developing the data modeling components, including the Data Dictionary and Entity Relationship Diagram (ERD), to define the structure of system data and relationships between system entities such as parents, children, administrators, reports, alerts, and filtering policies.
After completing the analysis phase, the project will proceed to the design phase. This phase will include the creation of the system architecture, identification of architecture components, and specification of the required hardware and software environment. The future work will also include designing a secure and scalable architecture capable of supporting AI-based real-time content analysis and parental monitoring services.
In addition, future development will involve designing the user interface of the system, including graphical elements, navigation schemes, dashboards, and mobile application interfaces for parents and children. Special attention will be given to usability, accessibility, and responsive design to ensure a user-friendly experience.
The data design phase will also be completed by developing the Conceptual Data Model (CDM), Logical Data Model (LDM), and Physical Data Model (PDM), in addition to selecting suitable data storage technologies and database structures for efficient and secure data management.
During the implementation phase, the project will focus on object-oriented system development, including the creation of class diagrams, sequence diagrams, and software environment configuration. The AI models for Arabic harmful content detection will be integrated with the application backend and filtering engine.
Future work will also include implementing and testing the complete system prototype. Different testing approaches such as unit testing and integration testing will be conducted to ensure system reliability, performance, security, and accuracy.
 
References
[1]	eSafety Commissioner. (2025). Protecting children online. Catholic Diocese of Maitland-Newcastle News. https://mn.catholic.org.au/news/esafety-protecting-children-online/
[2]	Hithnawi, R. I., Hamarsheh, M. M. N., & Maree, M. (2025). AraBERT for Arabic cyberbullying detection in Facebook comments. Journal of Cybersecurity, 11(1). https://doi.org/10.1093/cybsec/tyaf030 
[3]	Morocco World News. (2021, August 10). Arabic, fifth most spoken language in the world. https://www.moroccoworldnews.com/2021/08/56251/arabic-fifth-most-spoken-language-in-the-world/
[4]	Alsuwaylimi, A. A., & Alenezi, Z. S. (2025). Leveraging transformers for detection of Arabic cyberbullying on social media: Hybrid Arabic transformers. Computers, Materials and Continua, 83(2), 3165–3185. https://doi.org/10.32604/cmc.2025.061674
[5]	Bark. (n.d.). Supported languages. https://support.bark.us/hc/en-us/articles/360049966192-Supported-languages
[6]	Google LLC. (n.d.). Qustodio parental control app – screen time & family safety [Mobile app]. Play Store. https://play.google.com/store/apps/details?id=com.qustodio.family.parental.control.app.screentime&hl=en_US
[7]	KidsNanny. (n.d.). KidsNanny parental control application. Retrieved April 21, 2026, from https://kidsnanny.ca/
