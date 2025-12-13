# Sending WhatsApp messages

In order to send a WhatsApp message, you must have an active WhatsApp channel and perform a HTTP request to the following endpoint with a valid [access key](https://docs.bird.com/api/api-access/api-authorization)

## Send a message

> Send a message to a channel

```json
{"openapi":"3.0.3","info":{"title":"Channels","version":"v1"},"tags":[{"name":"channel_message","description":"Messages are the data sent and received through channels."}],"servers":[{"url":"https://api.bird.com","description":"Production API"}],"security":[{"accessKey":[]}],"components":{"securitySchemes":{"accessKey":{"description":"Uses the Authorization header: 'AccessKey ' followed by your access key token (e.g., 'Authorization: AccessKey AbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIj')","scheme":"AccessKey","type":"http"}},"schemas":{"CreateMessage":{"allOf":[{"type":"object","title":"CreateChannelMessage","additionalProperties":false,"required":["receiver"],"properties":{"sender":{"$ref":"#/components/schemas/Sender"},"receiver":{"$ref":"#/components/schemas/Receiver"},"reference":{"$ref":"#/components/schemas/Reference"},"template":{"$ref":"#/components/schemas/Template"},"meta":{"$ref":"#/components/schemas/Meta"},"replyTo":{"$ref":"#/components/schemas/ReplyTo"},"body":{"$ref":"#/components/schemas/Body"},"notification":{"$ref":"#/components/schemas/Notification"},"capFrequency":{"type":"boolean","description":"If set to true, the frequency capping settings of the platform will be used\nto either allow or reject the message to a contact. Can only be set to true\nif the message is sent to a contact and `.meta.extraInformation.useCase` is `marketing`.\n"},"enableLinkTracking":{"type":"boolean","description":"If set to true and message is a test/campaign message, web tracking parameters will be appended to the links in the message.\n"},"ignoreQuietHours":{"type":"boolean","description":"If set to true, quiet hours settings will be ignored and the message will be sent as soon as possible."},"ignoreGlobalHoldout":{"type":"boolean","description":"Do not check if the recipient is part of global holdout. To be used to send transactional messages."},"tags":{"$ref":"#/components/schemas/Tags"},"shortLinks":{"$ref":"#/components/schemas/ShortLinks"},"scheduledFor":{"$ref":"#/components/schemas/ScheduledFor"},"validity":{"$ref":"#/components/schemas/Validity"}}},{"anyOf":[{"type":"object","title":"ChannelMessageCreateWithTemplate","required":["template"]},{"type":"object","title":"ChannelMessageCreateWithBody","required":["body"]}]}]},"Sender":{"type":"object","additionalProperties":false,"properties":{"connector":{"type":"object","description":"The sender of the message. For email messages, the sender is used to override the default sender username.\n","properties":{"identifierValue":{"type":"string","description":"The identifier value of the sender.\n"},"annotations":{"$ref":"#/components/schemas/MessageAnnotations"}},"required":["identifierValue"]}},"required":["connector"]},"MessageAnnotations":{"type":"object","title":"MessageAnnotations","description":"Annotations are used to add additional information to a message.\nFor email messages, it can be used to specify a custom sender name.\n","additionalProperties":false,"properties":{"name":{"type":"string"}}},"Receiver":{"type":"object","additionalProperties":false,"properties":{"contacts":{"type":"array","minLength":1,"items":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string","description":"The ID of the receiver. This is a reference to a contact."},"identifierKey":{"type":"string","description":"The identifier key for finding the contact."},"identifierValue":{"type":"string","description":"The identifier value for finding the contact."},"type":{"type":"string","description":"The type of the receiver.","enum":["cc","bcc","to"]},"identifiers":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["identifierKey","identifierValue"],"properties":{"identifierKey":{"type":"string","description":"The identifier key for finding the contact."},"identifierValue":{"type":"string","description":"The identifier value for finding the contact."}}}},"platformAddress":{"type":"string","description":"The value that is used to send the message to the platform.\n"},"platformAddressSelector":{"type":"string","nullable":true,"description":"An expression that defines how we resolve the platform address (e.g. phone number or email address) from a contact.\nThis is an optional override for the default resolution logic (i.e. sending to the first\nidentifier key-value pair for the relevant platform).\n"}}}}}},"Reference":{"type":"string","description":"A reference to the message. This can be used to identify the message in the channel.\n"},"Template":{"type":"object","nullable":true,"additionalProperties":false,"properties":{"name":{"type":"string","description":"The platform name of the template."},"projectId":{"type":"string","description":"the ID of the project from the project from Studio"},"version":{"type":"string","description":"The version of the template."},"locale":{"type":"string","format":"locale-bcp47"},"attachments":{"type":"array","nullable":true,"items":{"type":"object","additionalProperties":false,"required":["mediaUrl","filename"],"properties":{"mediaUrl":{"type":"string","format":"uri","description":"The URL of the attachment."},"filename":{"type":"string","description":"The filename of the attachment."},"inline":{"type":"boolean"}}}},"shortLinks":{"nullable":true,"type":"object","description":"SMS link shortening options.","properties":{"enabled":{"type":"boolean","description":"Enables link shortening for SMS messages."},"domain":{"type":"string","description":"The domain to use when shortening links. When set to `default`,\nuses the default link shortening domain for the workspace.\n"}}},"variables":{"nullable":true,"type":"object","properties":{"default":{"type":"string"}},"additionalProperties":{"type":"string"}},"utmParameters":{"nullable":true,"type":"array","description":"The list of UTM parameters.","minItems":1,"maxItems":8,"items":{"oneOf":[{"type":"object","required":["key","value"],"additionalProperties":false,"properties":{"key":{"type":"string","description":"The name of the parameter in the query string.","minLength":1,"maxLength":20},"value":{"type":"string","description":"The static value of the parameter. Mutually exclusive with Reference.","minLength":1,"maxLength":100}}},{"type":"object","required":["key","reference"],"additionalProperties":false,"properties":{"key":{"type":"string","description":"The name of the parameter in the query string.","minLength":1,"maxLength":20},"reference":{"type":"string","description":"The reference to a dynamic value. Mutually exclusive with Value.","enum":["platform_name","channel_name"]}}}]}},"parameters":{"nullable":true,"type":"array","minLength":1,"items":{"$ref":"#/components/schemas/TemplateParameter"}},"settings":{"nullable":true,"type":"object","properties":{"disallowMmLite":{"type":"boolean","nullable":true,"description":"This is specific for WhatsApp marketing templates and requires MM Lite to be disabled for the WABAID.\n"}}}}},"TemplateParameter":{"oneOf":[{"type":"object","additionalProperties":false,"required":["type","key"],"properties":{"type":{"type":"string","enum":["string"]},"key":{"type":"string","minLength":1},"value":{"type":"string"}}},{"type":"object","additionalProperties":false,"required":["type","key"],"properties":{"type":{"type":"string","enum":["number"]},"key":{"type":"string","minLength":1},"value":{"type":"number"}}},{"type":"object","additionalProperties":false,"required":["type","key"],"properties":{"type":{"type":"string","enum":["boolean"]},"key":{"type":"string","minLength":1},"value":{"type":"boolean"}}},{"type":"object","additionalProperties":false,"required":["type","key"],"properties":{"type":{"type":"string","enum":["object"]},"key":{"type":"string","minLength":1},"value":{"type":"object","additionalProperties":true}}},{"type":"object","additionalProperties":false,"required":["type","key"],"properties":{"type":{"type":"string","enum":["sectionList"]},"key":{"type":"string","minLength":1},"value":{"type":"object","required":["sections"],"additionalProperties":false,"properties":{"sections":{"$ref":"#/components/schemas/Sections"}}}}},{"type":"object","additionalProperties":false,"required":["type","key"],"properties":{"type":{"type":"string","enum":["timeslotList"]},"key":{"type":"string","minLength":1},"value":{"type":"object","required":["timeslots"],"additionalProperties":false,"properties":{"timeslots":{"$ref":"#/components/schemas/Timeslots"}}}}},{"type":"object","additionalProperties":false,"required":["type","key"],"properties":{"type":{"type":"string","enum":["productSections"]},"key":{"type":"string","minLength":1},"value":{"type":"object","required":["productSections"],"additionalProperties":false,"properties":{"productSections":{"$ref":"#/components/schemas/ProductSections"}}}}},{"type":"object","additionalProperties":false,"required":["type","key"],"properties":{"type":{"type":"string","enum":["productList"]},"key":{"type":"string","minLength":1},"value":{"type":"object","required":["products"],"additionalProperties":false,"properties":{"products":{"$ref":"#/components/schemas/ProductList"}}}}},{"type":"object","additionalProperties":false,"required":["type","key"],"properties":{"type":{"type":"string","enum":["shippingMethodList"]},"key":{"type":"string","minLength":1},"value":{"type":"object","required":["shippingMethods"],"additionalProperties":false,"properties":{"shippingMethods":{"$ref":"#/components/schemas/AppleShippingMethods"}}}}},{"type":"object","additionalProperties":false,"required":["type","key"],"properties":{"type":{"type":"string","enum":["lineItemList"]},"key":{"type":"string","minLength":1},"value":{"type":"object","required":["lineItems"],"additionalProperties":false,"properties":{"lineItems":{"$ref":"#/components/schemas/AppleLineItems"}}}}},{"type":"object","additionalProperties":false,"required":["type","key"],"properties":{"type":{"type":"string","enum":["whatsappProductSections"]},"key":{"type":"string","minLength":1},"value":{"type":"object","required":["sections"],"additionalProperties":false,"properties":{"sections":{"$ref":"#/components/schemas/WhatsappProductSections"}}}}},{"type":"object","additionalProperties":false,"required":["type","key"],"properties":{"type":{"type":"string","enum":["whatsappProductItems"]},"key":{"type":"string","minLength":1},"value":{"type":"object","required":["products"],"additionalProperties":false,"properties":{"products":{"type":"array","items":{"$ref":"#/components/schemas/WhatsappProductItem"}}}}}}]},"Sections":{"type":"array","nullable":true,"items":{"type":"object","additionalProperties":false,"required":["title","items"],"properties":{"id":{"type":"string","nullable":true},"multipleSelection":{"type":"boolean"},"title":{"type":"string"},"items":{"type":"array","items":{"$ref":"#/components/schemas/ReplyAction"}}}}},"ReplyAction":{"type":"object","required":["type","replyAction"],"properties":{"id":{"type":"string"},"type":{"type":"string","enum":["reply-action"]},"reference":{"type":"string"},"role":{"type":"string"},"hidden":{"type":"boolean"},"replyAction":{"type":"object","properties":{"text":{"type":"string"},"imageUrl":{"type":"string"},"payload":{"type":"string"},"subTitle":{"type":"string"}},"required":["text"]}}},"Timeslots":{"type":"array","nullable":false,"items":{"type":"object","additionalProperties":false,"required":["startTime","duration"],"properties":{"id":{"type":"string","nullable":true},"startTime":{"type":"string","format":"date-time"},"duration":{"type":"number"}}}},"ProductSections":{"type":"array","nullable":false,"items":{"type":"object","additionalProperties":false,"required":["title","products"],"properties":{"title":{"type":"string","minLength":1,"maxLength":24},"products":{"type":"array","items":{"$ref":"#/components/schemas/Product"}}}}},"Product":{"type":"object","additionalProperties":false,"required":["externalProductId"],"properties":{"externalProductId":{"type":"string"},"amount":{"type":"string"},"text":{"type":"string"}}},"ProductList":{"type":"array","nullable":false,"items":{"type":"object","additionalProperties":false,"required":["type","product"],"properties":{"type":{"type":"string","enum":["product"]},"product":{"$ref":"#/components/schemas/Product"}}}},"AppleShippingMethods":{"type":"array","nullable":true,"items":{"type":"object","additionalProperties":false,"required":["amount","label","identifier","detail"],"properties":{"amount":{"type":"string"},"label":{"type":"string"},"identifier":{"type":"string"},"detail":{"type":"string"}}}},"AppleLineItems":{"type":"array","nullable":true,"items":{"type":"object","additionalProperties":false,"required":["amount","text"],"properties":{"amount":{"type":"string"},"text":{"type":"string"},"type":{"type":"string","enum":["pending","final"]}}}},"WhatsappProductSections":{"type":"array","nullable":false,"items":{"$ref":"#/components/schemas/WhatsappProductSection"}},"WhatsappProductSection":{"type":"object","additionalProperties":false,"required":["type","whatsappProductSection"],"properties":{"id":{"type":"string"},"type":{"type":"string","enum":["whatsapp-product-section"]},"reference":{"type":"string"},"role":{"type":"string"},"hidden":{"type":"boolean"},"whatsappProductSection":{"type":"object","additionalProperties":false,"required":["title","products"],"properties":{"title":{"type":"string","minLength":1,"maxLength":24},"products":{"type":"array","items":{"$ref":"#/components/schemas/WhatsappProductItem"}}}}}},"WhatsappProductItem":{"type":"object","additionalProperties":false,"required":["type","whatsappProductItem"],"properties":{"id":{"type":"string"},"type":{"type":"string","enum":["whatsapp-product-item"]},"reference":{"type":"string"},"role":{"type":"string"},"hidden":{"type":"boolean"},"whatsappProductItem":{"type":"object","additionalProperties":false,"required":["externalProductId"],"properties":{"externalProductId":{"type":"string"}}}}},"Meta":{"type":"object","additionalProperties":false,"properties":{"extraInformation":{"type":"object","additionalProperties":true,"description":"Additional information about the message.\n"},"referral":{"$ref":"#/components/schemas/MessageReferral"},"order":{"$ref":"#/components/schemas/MessageOrder"},"referredProduct":{"$ref":"#/components/schemas/ReferredProduct"},"email":{"$ref":"#/components/schemas/MetaEmail"},"pushNotifications":{"$ref":"#/components/schemas/MetaPushNotifications"},"navigatorId":{"$ref":"#/components/schemas/Id-2"},"navigatorMessageId":{"$ref":"#/components/schemas/Id-2"},"flow":{"$ref":"#/components/schemas/MetaFlow"},"journey":{"$ref":"#/components/schemas/MetaFlow"},"campaign":{"$ref":"#/components/schemas/MetaCampaign"}}},"MessageReferral":{"type":"object","additionalProperties":false,"properties":{"source":{"type":"string"},"title":{"type":"string","nullable":true},"text":{"type":"string","nullable":true},"group":{"type":"string","nullable":true},"metadata":{"type":"object","nullable":true,"additionalProperties":false,"properties":{"source_id":{"type":"string"},"source_url":{"type":"string","nullable":true},"media_url":{"type":"string","nullable":true},"tracking_id":{"type":"string","nullable":true}}}}},"MessageOrder":{"type":"object","additionalProperties":false,"description":"The order object contains information about the purchase order.","properties":{"products":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"externalCatalogId":{"type":"string","description":"The platform-specific catalog ID of the product."},"externalProductId":{"type":"string","description":"The platform-specific product ID."},"quantity":{"type":"integer","description":"The number of items purchased."},"price":{"type":"object","description":"The price of the product.","additionalProperties":false,"properties":{"amount":{"type":"integer"},"exponent":{"type":"integer"},"currencyCode":{"type":"string"}}}}}}}},"ReferredProduct":{"type":"object","additionalProperties":false,"description":"Referred product in an incoming message.","nullable":true,"properties":{"externalCatalogId":{"type":"string","description":"The platform-specific catalog ID of the product."},"externalProductId":{"type":"string","description":"The platform-specific product ID."}}},"MetaEmail":{"type":"object","additionalProperties":false,"properties":{"subject":{"type":"string"},"headers":{"type":"object","additionalProperties":{"type":"string"}},"from":{"type":"object","additionalProperties":false,"properties":{"username":{"type":"string","pattern":"[\\w\\d.-/+]+"},"displayName":{"type":"string"}}}}},"MetaPushNotifications":{"type":"object","additionalProperties":false,"properties":{"gatewayTypeOverride":{"type":"string","enum":["apns","firebase","web"]}}},"Id-2":{"type":"string","format":"uuid"},"MetaFlow":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string","format":"uuid","nullable":true},"name":{"type":"string","nullable":true},"stepId":{"type":"string","nullable":true},"runId":{"type":"string","format":"uuid","nullable":true}}},"MetaCampaign":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string","format":"uuid","nullable":true},"name":{"type":"string","nullable":true}}},"ReplyTo":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string","description":"The ID of the message that is being replied to."},"order":{"type":"integer","description":"The order of the message in the conversation."},"type":{"type":"string","enum":["message","click","referrals"]}},"required":["id","type"]},"Body":{"type":"object","title":"MessageBody","nullable":true,"allOf":[{"type":"object","required":["type"],"properties":{"type":{"$ref":"#/components/schemas/BodyTypes"}}},{"oneOf":[{"$ref":"#/components/schemas/TypeText"},{"$ref":"#/components/schemas/TypeHTML"},{"$ref":"#/components/schemas/TypeImage"},{"$ref":"#/components/schemas/TypeFile"},{"$ref":"#/components/schemas/TypeGif"},{"$ref":"#/components/schemas/TypeLocation"},{"$ref":"#/components/schemas/TypeCarousel"},{"$ref":"#/components/schemas/TypeList"},{"$ref":"#/components/schemas/TypeSection"},{"$ref":"#/components/schemas/TypeAuthentication"},{"$ref":"#/components/schemas/TypeAction"}],"discriminator":{"propertyName":"type","mapping":{"text":"#/components/schemas/TypeText","html":"#/components/schemas/TypeHTML","image":"#/components/schemas/TypeImage","file":"#/components/schemas/TypeFile","gif":"#/components/schemas/TypeGif","location":"#/components/schemas/TypeLocation","carousel":"#/components/schemas/TypeCarousel","list":"#/components/schemas/TypeList","section":"#/components/schemas/TypeSection","authentication":"#/components/schemas/TypeAuthentication","action":"#/components/schemas/TypeAction"}}}]},"BodyTypes":{"type":"string","enum":["text","html","image","file","gif","location","carousel","list","section","authentication","template","action"]},"TypeText":{"type":"object","required":["text","type"],"additionalProperties":false,"properties":{"type":{"type":"string","enum":["text"]},"text":{"type":"object","additionalProperties":false,"required":["text"],"properties":{"text":{"type":"string","minLength":1},"attachments":{"type":"array","nullable":true,"items":{"type":"object","additionalProperties":false,"required":["mediaUrl","filename"],"properties":{"mediaUrl":{"type":"string","format":"uri"},"filename":{"type":"string"},"inline":{"type":"boolean"},"contentId":{"type":"string"}}}},"actions":{"$ref":"#/components/schemas/Actions"},"metadata":{"type":"object","additionalProperties":false,"properties":{"subject":{"type":"string"},"headers":{"type":"object","additionalProperties":{"type":"string"}},"whatsapp":{"type":"object","additionalProperties":false,"properties":{"previewUrl":{"type":"boolean","description":"When set to `true`, preview will be displayed within whatsapp chat."}}},"line":{"type":"object","additionalProperties":false,"properties":{"emoji":{"type":"object","additionalProperties":false,"properties":{"items":{"type":"array","nullable":true,"items":{"type":"object","additionalProperties":false,"required":["index","productId","emojiId"],"properties":{"index":{"type":"integer"},"productId":{"type":"string"},"emojiId":{"type":"string"},"length":{"type":"integer","nullable":true,"readOnly":true}}}}}}}},"telegram":{"$ref":"#/components/schemas/MetadataTelegram"},"apple":{"$ref":"#/components/schemas/MetadataApple"}}}}}}},"Actions":{"type":"array","nullable":true,"items":{"$ref":"#/components/schemas/Action"}},"Action":{"allOf":[{"type":"object","required":["type"],"properties":{"type":{"type":"string","enum":["link","reply","locationRequest","buy","postback"]}}},{"oneOf":[{"$ref":"#/components/schemas/ActionLink"},{"$ref":"#/components/schemas/ActionReply"},{"$ref":"#/components/schemas/ActionLocationRequest"},{"$ref":"#/components/schemas/ActionBuy"},{"$ref":"#/components/schemas/ActionPostback"}],"discriminator":{"propertyName":"type","mapping":{"link":"#/components/schemas/ActionLink","reply":"#/components/schemas/ActionReply","locationRequest":"#/components/schemas/ActionLocationRequest","buy":"#/components/schemas/ActionBuy","postback":"#/components/schemas/ActionPostback"}}}]},"ActionLink":{"type":"object","required":["link","type"],"properties":{"type":{"type":"string","enum":["link"]},"link":{"type":"object","required":["text","url"],"properties":{"text":{"type":"string"},"url":{"anyOf":[{"type":"string","pattern":"{{[^{}]+}}"},{"type":"string","format":"uri"}]}}}}},"ActionReply":{"type":"object","required":["reply","type"],"properties":{"type":{"type":"string","enum":["reply"]},"reply":{"type":"object","properties":{"text":{"type":"string"},"imageUrl":{"type":"string"},"metadata":{"$ref":"#/components/schemas/ActionReplyMetadata"}},"required":["text"]}}},"ActionReplyMetadata":{"type":"object","properties":{"description":{"$ref":"#/components/schemas/ActionDescription"}}},"ActionDescription":{"type":"object","description":"Sets the description in the row objects for Whatsapp list messages. Only available usage for Whatsapp platform","additionalProperties":false,"properties":{"label":{"type":"string","maxLength":72}}},"ActionLocationRequest":{"type":"object","required":["type"],"properties":{"type":{"type":"string","enum":["locationRequest"]},"locationRequest":{"type":"object","nullable":true,"properties":{"text":{"type":"string","default":"Send location"}}}}},"ActionBuy":{"type":"object","required":["buy","type"],"properties":{"type":{"type":"string","enum":["buy"]},"buy":{"type":"object","properties":{"text":{"type":"string"},"amountCents":{"type":"integer"},"currency":{"type":"string","minLength":3,"maxLength":3}},"required":["text","amountCents","currency"]}}},"ActionPostback":{"type":"object","required":["postback","type"],"properties":{"type":{"type":"string","enum":["postback"]},"postback":{"type":"object","properties":{"text":{"type":"string"},"payload":{"type":"string"},"imageUrl":{"type":"string"},"metadata":{"$ref":"#/components/schemas/ActionPostbackMetadata"}},"required":["text"]}}},"ActionPostbackMetadata":{"type":"object","properties":{"description":{"$ref":"#/components/schemas/ActionDescription"}}},"MetadataTelegram":{"type":"object","description":"The property is specific to Telegram, indicating the markup type to be used for message formatting","additionalProperties":false,"properties":{"parseMode":{"type":"string","enum":["Markdown","MarkdownV2"]}}},"MetadataApple":{"type":"object","description":"The property is specific to Apple Business Chat, containing Apple-specific metadata","additionalProperties":false,"properties":{"summaryText":{"type":"string","description":"Summary text for Apple Business Chat messages"}}},"TypeHTML":{"type":"object","required":["html","type"],"additionalProperties":false,"properties":{"type":{"type":"string","enum":["html"]},"html":{"type":"object","additionalProperties":false,"anyOf":[{"required":["text"]},{"required":["html"]}],"properties":{"text":{"type":"string","minLength":1},"html":{"type":"string","minLength":1},"attachments":{"type":"array","nullable":true,"items":{"type":"object","additionalProperties":false,"anyOf":[{"required":["mediaUrl","filename"]},{"required":["content","contentType","filename"]}],"properties":{"mediaUrl":{"type":"string","format":"uri"},"filename":{"type":"string"},"inline":{"type":"boolean"},"content":{"type":"string","minLength":1},"contentType":{"type":"string","minLength":1},"contentId":{"type":"string"}}}},"actions":{"$ref":"#/components/schemas/Actions"},"metadata":{"type":"object","additionalProperties":false,"properties":{"subject":{"type":"string"},"emailFrom":{"type":"object","additionalProperties":false,"properties":{"username":{"type":"string","pattern":"[\\w\\d.-/+]+"},"displayName":{"type":"string"}}},"headers":{"type":"object","additionalProperties":{"type":"string"}},"initialOpenTracking":{"type":"boolean"},"clickTracking":{"type":"boolean"},"openTracking":{"type":"boolean"}}}}}}},"TypeImage":{"type":"object","required":["image","type"],"additionalProperties":false,"properties":{"type":{"type":"string","enum":["image"]},"image":{"type":"object","additionalProperties":false,"required":["images"],"properties":{"text":{"type":"string"},"images":{"type":"array","minLength":1,"items":{"type":"object","additionalProperties":false,"required":["mediaUrl"],"properties":{"mediaUrl":{"type":"string","format":"uri","minLength":1},"altText":{"type":"string"}}}},"metadata":{"type":"object","properties":{"subject":{"type":"string","description":"The property is specific mms file, shows the subject of the mms."},"fallbackText":{"type":"string","description":"The property is specific mms file, when a mms is not supported, it will fallback to show content with the fallbackText."},"storyType":{"type":"string","description":"The property is specific instagram file, shows the story type."},"telegram":{"$ref":"#/components/schemas/MetadataTelegram"}}},"actions":{"$ref":"#/components/schemas/Actions"}}}}},"TypeFile":{"type":"object","required":["file","type"],"additionalProperties":false,"properties":{"type":{"type":"string","enum":["file"]},"file":{"type":"object","additionalProperties":false,"required":["files"],"properties":{"text":{"type":"string"},"files":{"type":"array","minLength":1,"items":{"type":"object","additionalProperties":false,"required":["mediaUrl","contentType"],"properties":{"mediaUrl":{"type":"string","format":"uri","minLength":1},"contentType":{"type":"string","minLength":1},"filename":{"type":"string"},"altText":{"type":"string"},"metadata":{"type":"object","properties":{"isAnimated":{"type":"boolean","description":"The property is specific the sticker file, shows that if the sticker is animated or not."}}}}}},"metadata":{"type":"object","properties":{"subject":{"type":"string","description":"The property is specific mms file, shows the subject of the mms."},"fallbackText":{"type":"string","description":"The property is specific mms file, when a mms is not supported, it will fallback to show content with the fallbackText."},"storyType":{"type":"string","description":"The property is specific instagram file, shows the story type."},"telegram":{"$ref":"#/components/schemas/MetadataTelegram"}}},"actions":{"$ref":"#/components/schemas/Actions"}}}}},"TypeGif":{"type":"object","required":["gif","type"],"additionalProperties":false,"properties":{"type":{"type":"string","enum":["gif"]},"gif":{"type":"object","additionalProperties":false,"required":["mediaUrl"],"properties":{"text":{"type":"string"},"mediaUrl":{"type":"string","format":"uri","minLength":1},"altText":{"type":"string"},"actions":{"$ref":"#/components/schemas/Actions"},"metadata":{"type":"object","properties":{"telegram":{"$ref":"#/components/schemas/MetadataTelegram"}}}}}}},"TypeLocation":{"type":"object","required":["location","type"],"additionalProperties":false,"properties":{"type":{"type":"string","enum":["location"]},"location":{"type":"object","additionalProperties":false,"required":["coordinates"],"properties":{"coordinates":{"type":"object","additionalProperties":false,"properties":{"latitude":{"type":"number","format":"float","minimum":-90,"maximum":90},"longitude":{"type":"number","format":"float","minimum":-180,"maximum":180}}},"location":{"type":"object","additionalProperties":false,"properties":{"address":{"type":"string"},"label":{"type":"string"}}}}}}},"TypeCarousel":{"type":"object","required":["carousel","type"],"additionalProperties":false,"properties":{"type":{"type":"string","enum":["carousel"]},"carousel":{"type":"object","additionalProperties":false,"required":["items"],"properties":{"text":{"type":"string","description":"Optional text displayed above the carousel cards","maxLength":1024},"items":{"$ref":"#/components/schemas/Items"}}}}},"Items":{"type":"array","nullable":true,"items":{"type":"object","additionalProperties":false,"properties":{"title":{"type":"string"},"mediaUrl":{"type":"string","format":"uri","nullable":true},"description":{"type":"string"},"altText":{"type":"string"},"actions":{"$ref":"#/components/schemas/Actions"}}}},"TypeList":{"type":"object","required":["list","type"],"additionalProperties":false,"properties":{"type":{"type":"string","enum":["list"]},"list":{"type":"object","additionalProperties":false,"properties":{"title":{"type":"string"},"text":{"type":"string"},"altText":{"type":"string"},"items":{"$ref":"#/components/schemas/Items"},"actions":{"$ref":"#/components/schemas/Actions"},"metadata":{"type":"object","properties":{"button":{"type":"object","description":"Sets a button name for whatsapp list messages. Only available usage for Whatsapp platform","additionalProperties":false,"properties":{"label":{"type":"string","maxLength":20}}},"replyMessage":{"type":"object","description":"Sets the reply message to be used when a list item is picked. Used for Apple Business Chat.","additionalProperties":false,"properties":{"title":{"type":"string","maxLength":512},"text":{"type":"string","maxLength":512}}}}}},"required":["text"]}}},"TypeSection":{"type":"object","required":["section","type"],"additionalProperties":false,"properties":{"type":{"type":"string","enum":["section"]},"section":{"type":"object","additionalProperties":false,"properties":{"items":{"type":"array","items":{"minLength":1,"$ref":"#/components/schemas/SectionBody"}},"configurations":{"type":"object","additionalProperties":{"type":"string"}}}}}},"SectionBody":{"type":"object","title":"MessageBody","allOf":[{"type":"object","required":["type"],"properties":{"type":{"type":"string","enum":["text","image","file","gif","location","carousel","list","section"]}}},{"oneOf":[{"$ref":"#/components/schemas/TypeText"},{"$ref":"#/components/schemas/TypeImage"},{"$ref":"#/components/schemas/TypeFile"},{"$ref":"#/components/schemas/TypeGif"},{"$ref":"#/components/schemas/TypeLocation"},{"$ref":"#/components/schemas/TypeCarousel"},{"$ref":"#/components/schemas/TypeList"},{"$ref":"#/components/schemas/TypeSectionNested"}],"discriminator":{"propertyName":"type","mapping":{"text":"#/components/schemas/TypeText","image":"#/components/schemas/TypeImage","file":"#/components/schemas/TypeFile","gif":"#/components/schemas/TypeGif","location":"#/components/schemas/TypeLocation","carousel":"#/components/schemas/TypeCarousel","list":"#/components/schemas/TypeList","section":"#/components/schemas/TypeSectionNested"}}}]},"TypeSectionNested":{"type":"object","required":["section","type"],"additionalProperties":false,"properties":{"type":{"type":"string","enum":["section"]},"section":{"type":"object","additionalProperties":false,"properties":{"items":{"type":"array","items":{"minLength":1,"$ref":"#/components/schemas/SectionBodyNested"}},"configurations":{"type":"object","properties":{"default":{"type":"string"}},"additionalProperties":{"type":"string"}}}}}},"SectionBodyNested":{"type":"object","title":"MessageBody","allOf":[{"type":"object","required":["type"],"properties":{"type":{"type":"string","enum":["text","image","file","gif","location","carousel","list"]}}},{"oneOf":[{"$ref":"#/components/schemas/TypeText"},{"$ref":"#/components/schemas/TypeImage"},{"$ref":"#/components/schemas/TypeFile"},{"$ref":"#/components/schemas/TypeGif"},{"$ref":"#/components/schemas/TypeLocation"},{"$ref":"#/components/schemas/TypeCarousel"},{"$ref":"#/components/schemas/TypeList"}],"discriminator":{"propertyName":"type","mapping":{"text":"#/components/schemas/TypeText","image":"#/components/schemas/TypeImage","file":"#/components/schemas/TypeFile","gif":"#/components/schemas/TypeGif","location":"#/components/schemas/TypeLocation","carousel":"#/components/schemas/TypeCarousel","list":"#/components/schemas/TypeList"}}}]},"TypeAuthentication":{"type":"object","required":["authentication","type"],"additionalProperties":false,"properties":{"type":{"type":"string","enum":["authentication"]},"authentication":{"type":"object","additionalProperties":false,"properties":{"otp":{"type":"object","additionalProperties":false,"required":["disclaimer"],"properties":{"disclaimer":{"type":"boolean","description":"Whether to add a security disclaimer to the authentication body.","nullable":false},"expirationTime":{"type":"integer","minimum":1,"maximum":90,"nullable":true,"description":"The number of seconds after which the authentication body will expire. If not set, no expiration notification will be sent."},"actions":{"$ref":"#/components/schemas/Actions"}}}}}}},"TypeAction":{"type":"object","required":["type"],"additionalProperties":false,"properties":{"type":{"type":"string","enum":["permission_request"]},"permission_request":{"type":"object","required":["resource"],"properties":{"resource":{"type":"string","enum":["call"]}}}}},"Notification":{"type":"object","title":"ChannelNotification","properties":{"url":{"type":"string","description":"A custom webhook url to send events to. Note: you should have a created webhook subscription.\nRefer to the Notifications API to learn how to create a webhook subscription.\n"}}},"Tags":{"type":"array","description":"Tags to associate with the message. Tags are converted to lower case and tags\nthat do not exist are automatically created. You can view your created tags\nin the UI. You can specify up to 10 tags per message.\n","maxItems":10,"items":{"$ref":"#/components/schemas/Name-3"}},"Name-3":{"type":"string","pattern":"^[a-zA-Z0-9-_ ]+$","minLength":1,"maxLength":50,"description":"Tag name. Must be between 1 and 50 characters and must only contain\nalphanumeric characters, hyphens, underscores, and spaces.\n"},"ShortLinks":{"nullable":true,"type":"object","description":"SMS link shortening options. When using templates, please refer to\nthe template level `shortLinks` instead.\n","additionalProperties":false,"required":["domain"],"properties":{"domain":{"type":"string","maxLength":128,"description":"The domain to use when shortening links. When set to `default`,\nuses the default link shortening domain for the workspace.\n"}}},"ScheduledFor":{"type":"string","format":"date-time","description":"Scheduled time to send message at. Must be formated as RFC3339 timestamp. When\nset, the message status will be `scheduled` until it's sent. Messages scheduled\nfor a time in the past or within 10 minutes of the request may be sent\nimmediately. Messages scheduled farther than 35 days will be rejected.\n"},"Validity":{"type":"integer","description":"Validity determines for how many seconds a message is valid. If none is provided, the channel message type will be used to determine it.\nA promotional, conversational or transactional channel message is valid for 36 hours (129600 seconds). A message sent from a 2FA channel is valid for 10 minutes (600 seconds).\n","minimum":0},"Message":{"type":"object","title":"ChannelMessage","allOf":[{"type":"object","properties":{"id":{"$ref":"#/components/schemas/Id-2"},"channelId":{"$ref":"#/components/schemas/ChannelId"},"sender":{"oneOf":[{"$ref":"#/components/schemas/Connector"},{"$ref":"#/components/schemas/Contact"}]},"receiver":{"oneOf":[{"$ref":"#/components/schemas/Connector"},{"$ref":"#/components/schemas/Contacts"}]},"meta":{"$ref":"#/components/schemas/Meta"},"reference":{"$ref":"#/components/schemas/Reference"},"parts":{"$ref":"#/components/schemas/Parts"},"status":{"$ref":"#/components/schemas/Status-3"},"reason":{"type":"string"},"direction":{"$ref":"#/components/schemas/Direction"},"origin":{"$ref":"#/components/schemas/Origin"},"replyTo":{"$ref":"#/components/schemas/ReplyTo"},"lastStatusAt":{"type":"string","format":"date-time"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"details":{"description":"This field is used to store additional information related to the message status.\n","type":"string"},"failure":{"$ref":"#/components/schemas/Failure"},"tags":{"$ref":"#/components/schemas/Tags"},"shortLinks":{"$ref":"#/components/schemas/ShortLinks"},"scheduledFor":{"$ref":"#/components/schemas/ScheduledFor"}},"required":["id","channelId","sender","receiver","status","lastStatusAt","createdAt","updatedAt"]},{"anyOf":[{"type":"object","properties":{"body":{"$ref":"#/components/schemas/Body"}},"required":["body"]},{"type":"object","properties":{"template":{"$ref":"#/components/schemas/Template"}},"required":["template"]}]}]},"ChannelId":{"type":"string","format":"uuid"},"Connector":{"type":"object","title":"ChannelConnector","additionalProperties":false,"properties":{"connector":{"type":"object","properties":{"id":{"type":"string","format":"uuid"},"identifierValue":{"type":"string"},"annotations":{"$ref":"#/components/schemas/MessageAnnotations"},"types":{"type":"array","items":{"type":"string"}}},"required":["id"]}},"required":["connector"]},"Contact":{"type":"object","title":"ChannelContact","additionalProperties":false,"properties":{"contact":{"type":"object","properties":{"id":{"type":"string"},"identifierKey":{"type":"string"},"identifierValue":{"type":"string"},"type":{"type":"string"},"countryCode":{"type":"string"},"platformAddress":{"type":"string"},"platformAddressSelector":{"type":"string"},"annotations":{"type":"object","additionalProperties":true,"properties":{"name":{"type":"string"}}}},"required":["id","identifierKey","identifierValue"]}},"required":["contact"]},"Contacts":{"type":"object","title":"ChannelContacts","additionalProperties":false,"properties":{"contacts":{"type":"array","minLength":1,"items":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string"},"identifierKey":{"type":"string"},"identifierValue":{"type":"string"},"type":{"type":"string"},"countryCode":{"type":"string"},"identifiers":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"identifierKey":{"type":"string"},"identifierValue":{"type":"string"}}}},"platformAddress":{"type":"string"},"platformAddressSelector":{"type":"string","nullable":true},"annotations":{"type":"object","additionalProperties":true,"properties":{"name":{"type":"string"}}}}}}},"required":["contacts"]},"Parts":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"platformReference":{"type":"string"}}}},"Status-3":{"type":"string","enum":["accepted","rejected","processing","scheduled","sent","sending_failed","delivered","delivery_failed","deleted","skipped"]},"Direction":{"type":"string","enum":["incoming","outgoing"]},"Origin":{"type":"object","nullable":true,"additionalProperties":false,"required":["type","id"],"properties":{"type":{"type":"string","description":"origin type of message."},"id":{"type":"string","description":"origin id of message."}}},"Failure":{"type":"object","nullable":true,"additionalProperties":false,"properties":{"code":{"type":"integer","description":"omni channel interpretation of the failure to categorise the nature of message error."},"description":{"type":"string","description":"human readable description of the error."},"source":{"type":"object","additionalProperties":false,"properties":{"code":{"type":"string","description":"numerical, text or alphanumeric code that indicates the error or issue while delivering the message in the last step."},"name":{"type":"string","description":"enum representing the step where the failure occurred. Example: # \"pre-processing\", \"accounting\", \"whatsapp\", \"email-sparkpost\", etc."}}}}},"RequestError":{"type":"object","properties":{"code":{"type":"string","description":"A unique code that identifies the error. This code can be used to programmatically identify the error.\n"},"message":{"type":"string","description":"A human-readable message that describes the error. An example is 'The requested resource does not exist: channel not found'.\n"}},"required":["code","message"]},"ValidationError":{"type":"object","properties":{"code":{"type":"string","description":"A unique code that identifies the error. This code can be used to programmatically identify the error.\n"},"message":{"type":"string","description":"A human-readable message that describes the error. An example is 'The requested resource does not exist: channel not found'.\n"},"details":{"type":"object","description":"Additional details about the error. This object can contain any additional information that may be useful for debugging.\n","additionalProperties":{"type":"array","items":{"type":"string"}}}},"required":["code","message"]}},"responses":{"requestError":{"description":"The request did not pass validation","content":{"application/json":{"schema":{"$ref":"#/components/schemas/RequestError"}}}},"validationError":{"description":"The request did not pass validation","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ValidationError"}}}}}},"paths":{"/workspaces/{workspaceId}/channels/{channelId}/messages":{"post":{"summary":"Send a message","operationId":"createChannelMessage","description":"Send a message to a channel","tags":["channel_message"],"requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/CreateMessage"}}}},"responses":{"202":{"description":"Message was accepted for processing","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Message"}}}},"400":{"$ref":"#/components/responses/requestError"},"404":{"$ref":"#/components/responses/requestError"},"409":{"description":"Creating the message was not possible because of conflicting conditions","content":{"application/json":{"schema":{"$ref":"#/components/schemas/RequestError"}}}},"422":{"$ref":"#/components/responses/validationError"}}}}}}
```

{% hint style="warning" %}
When sending [outbound messages](#outbound-messages) as well as setting the receiver information you must set message **body** field in all cases except for sending a message [template](#template) when you must only set the **template** field
{% endhint %}

**Body**

{% code lineNumbers="true" %}

```json
{
 "receiver": {
   "contacts": [
     {
       "identifierKey": "phonenumber",
       "identifierValue": "+31612345678"
     }
   ]
 },
 "body": {...}
}
```

{% endcode %}

**Template**

{% code lineNumbers="true" %}

```json
{
 "receiver": {
   "contacts": [
     {
       "identifierKey": "phonenumber",
       "identifierValue": "+31612345678"
     }
   ]
 },
 "template": {...}
}
```

{% endcode %}

If it has been more than 24 hours since a customer last messaged you, you have to start a conversation by sending a [template](#template) message first. Non-template messages can only be sent when the [customer care window](https://app.gitbook.com/s/U9kiDiTGVD8kkbnKKyEn/channels/channels/supported-channels/whatsapp/concepts/whatsapps-customer-care-window) is active. You can check the expiry time for an active customer care window for a contact by making a request as follows:

## Get channel details for a contact

> Retrieve channel information for a given contact.

```json
{"openapi":"3.0.3","info":{"title":"Channels","version":"v1"},"tags":[{"name":"channel","description":"Channels are the installation of a platform for a workspace."}],"servers":[{"url":"https://api.bird.com","description":"Production API"}],"security":[{"accessKey":[]}],"components":{"securitySchemes":{"accessKey":{"description":"Uses the Authorization header: 'AccessKey ' followed by your access key token (e.g., 'Authorization: AccessKey AbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIj')","scheme":"AccessKey","type":"http"}},"parameters":{"queryContactIdentifierValue":{"name":"contactIdentifierValue","description":"The receiver identifier value.","in":"query","allowEmptyValue":true,"schema":{"type":"string"}}},"schemas":{"ChannelContactInformation":{"type":"object","additionalProperties":false,"required":["serviceWindowExpireAt"],"properties":{"serviceWindowExpireAt":{"nullable":true,"type":"string","format":"date-time"},"isPermanentSession":{"nullable":true,"type":"boolean"},"metadata":{"nullable":true,"type":"object","additionalProperties":{"type":"string"}}}},"RequestError":{"type":"object","properties":{"code":{"type":"string","description":"A unique code that identifies the error. This code can be used to programmatically identify the error.\n"},"message":{"type":"string","description":"A human-readable message that describes the error. An example is 'The requested resource does not exist: channel not found'.\n"}},"required":["code","message"]}},"responses":{"requestError":{"description":"The request did not pass validation","content":{"application/json":{"schema":{"$ref":"#/components/schemas/RequestError"}}}}}},"paths":{"/workspaces/{workspaceId}/channels/{channelId}/contacts/{contactId}":{"get":{"summary":"Get channel details for a contact","operationId":"getChannelContactInformation","description":"Retrieve channel information for a given contact.","tags":["channel"],"parameters":[{"$ref":"#/components/parameters/queryContactIdentifierValue"}],"responses":{"200":{"description":"OK","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ChannelContactInformation"}}}},"404":{"$ref":"#/components/responses/requestError"}}}}}}
```

The Channels API supports many of the features of WhatsApp, however due to the omni channel nature of the API there may be some differences between the Channels API message and the native WhatsApp API. Here is an overview of the WhatsApp messages types and Channels API message types:

| WhatsApp API type                   | Channels API                                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| text                                | [text](#text)                                                                                                     |
| image / sticker                     | [image](#image)                                                                                                   |
| audio / document / video            | [file](#file)                                                                                                     |
| location                            | [location](#location)                                                                                             |
| reaction                            | -                                                                                                                 |
| interactive - quick reply button    | [text + action](#text-message-with-reply-buttons) / [image + action](#single-image-message-with-postback-actions) |
| interactive - list                  | [list](#list)                                                                                                     |
| interactive - carousel              | [carousel](#carousel)                                                                                             |
| interactive - multi product message | -                                                                                                                 |
| interactive - product               | -                                                                                                                 |
| contacts                            | -                                                                                                                 |
| replies                             | [replyTo](#replyto)                                                                                               |
| template                            | [template](#template)                                                                                             |

## Outbound messages

Except for the template section all examples below must be set in the body field.&#x20;

{% code lineNumbers="true" %}

```json
{
 "receiver": {
   "contacts": [
     {
       "identifierValue": "+31612345678"
     }
   ]
 },
 "body": {...}
}
```

{% endcode %}

### Text

#### Text Message

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-overflow="wrap" data-line-numbers><code class="lang-json">{
  "type": "text",
  "text": {
    "text": "Single text message"
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FR1kpxIjmaSpKe4WJWvKh%2Fimage.png?alt=media&#x26;token=2cb3da4e-d53a-4605-bee8-c801ecfe865d" alt=""></td></tr></tbody></table>

#### Text message with reply buttons

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-overflow="wrap" data-line-numbers data-expandable="true"><code class="lang-json">{
  "type": "text",
  "text": {
    "text": "Single text message with reply actions",
    "actions": [
      {
        "type": "reply",
        "reply": {
          "text": "Reply action 1"
        }
      },
      {
        "type": "reply",
        "reply": {
          "text": "Reply action 2"
        }
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FGCzsumxKN10eNNDnvD5h%2Fimage.png?alt=media&#x26;token=f789040b-9001-456d-84e1-0c8fbe8e1352" alt=""></td></tr></tbody></table>

#### Text message with postback actions

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-overflow="wrap" data-line-numbers data-expandable="true"><code class="lang-json">{
  "type": "text",
  "text": {
    "text": "Single text message with postback actions",
    "actions": [
      {
        "type": "postback",
        "postback": {
          "text": "Postback action 1",
          "payload": "postback-payload-1"
        }
      },
      {
        "type": "postback",
        "postback": {
          "text": "Postback action 2",
          "payload": "postback-payload-2"
        }
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FpchYBPGGHs4Rn87egyrc%2Fimage.png?alt=media&#x26;token=71217922-eca6-4ec8-8474-5c597f411035" alt=""></td></tr></tbody></table>

#### Text message with reply and postback actions

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-overflow="wrap" data-line-numbers data-expandable="true"><code class="lang-json">{
  "type": "text",
  "text": {
    "text": "Single text message with reply and postback actions",
    "actions": [
      {
        "type": "postback",
        "postback": {
          "text": "Postback action 1",
          "payload": "postback-payload-1"
        }
      },
      {
        "type": "reply",
        "reply": {
          "text": "Reply action 1"
        }
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FlQ9HkYZiQQ44LypP4dlF%2Fimage.png?alt=media&#x26;token=a3d2d525-7026-4a47-8339-269c10ba6378" alt=""></td></tr></tbody></table>

**Text message with location request**

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-overflow="wrap" data-line-numbers><code class="lang-json">{
    "text": "Single text message with location request",
    "actions": [
        {
            "type": "locationRequest"
        }
    ]
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FIYG9CS550fpDEAiDT428%2Fwhatsapp%20location%20share.png?alt=media&#x26;token=912b195e-3ea0-4eee-aa44-c017d5414f68" alt="" data-size="original"></td></tr></tbody></table>

### Image

#### Single image message

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-overflow="wrap" data-line-numbers data-expandable="true"><code class="lang-json">{
  "type": "image",
  "image": {
    "images": [
      {
        "altText": "Label of first image",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FRPPgQAGyZE7rvIh3WM2Z%2Fimage2.avif?alt=media"
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FLOlplP3YtH7PcgKRS2aA%2Fimage.png?alt=media&#x26;token=dc54321a-d7d5-4fe1-9391-329b087311dd" alt="" data-size="original"></td></tr></tbody></table>

#### Single image message with text

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers><code class="lang-json">{
  "type": "image",
  "image": {
    "images": [
      {
        "altText": "Label of first image",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FRPPgQAGyZE7rvIh3WM2Z%2Fimage2.avif?alt=media"
      }
    ],
    "text": "Single image message"
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FjaU6sRw3kdklw8bHfnuQ%2Fimage.png?alt=media&#x26;token=1500e624-44c7-4cbb-ac79-a4f33c5e6f87" alt=""></td></tr></tbody></table>

#### Multiple image message

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers><code class="lang-json">{
  "type": "image",
  "image": {
    "images": [
      {
        "altText": "Label of first image",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FrEM9zztd8SEiJS6RQuR3%2Fimage.png?alt=media"
      },
      {
        "altText": "Label of second image",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FRPPgQAGyZE7rvIh3WM2Z%2Fimage2.avif?alt=media"
      }
    ],
    "text": "Multiple images message"
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2F2p3kOGayGjezRCKjQRsb%2Fimage.png?alt=media&#x26;token=1aeb070a-3db4-403c-afca-53a6ce8e41d9" alt=""></td></tr></tbody></table>

#### Single image message with postback actions

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers data-expandable="true"><code class="lang-json">{"type": "image",
  "image": {
    "images": [
      {
        "altText": "Image label",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FrEM9zztd8SEiJS6RQuR3%2Fimage.png?alt=media"
      }
    ],
    "text": "Single image message with postback actions",
    "actions": [
      {
        "type": "postback",
        "postback": {
          "payload": "postback-payload-1",
          "text": "Postback option 1"
        }
      },
      {
        "postback": {
          "payload": "postback-payload-2",
          "text": "Postback option 2"
        },
        "type": "postback"
      }
    ]
  }
}
</code></pre></td><td></td></tr></tbody></table>

#### Single image message with label and reply actions

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers data-expandable="true"><code class="lang-json">{
  "type": "image",
  "image": {
    "text": "Single image message with reply actions",
    "images": [
      {
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FrEM9zztd8SEiJS6RQuR3%2Fimage.png?alt=media",
        "altText": "Image label"
      }
    ],
    "actions": [
      {
        "type": "reply",
        "reply": {
          "text": "Reply action 1"
        }
      },
      {
        "type": "reply",
        "reply": {
          "text": "Reply action 2"
        }
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FST2ZIFLmTVBw4984uGzD%2Fimage.png?alt=media&#x26;token=2889b6a6-c278-4608-87a1-d423189575f2" alt=""></td></tr></tbody></table>

#### Single image message with label, postback and reply actions

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers data-expandable="true"><code class="lang-json">{
  "type": "image",
  "image": {
    "text": "Single image message with postback and reply actions",
    "images": [
      {
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FrEM9zztd8SEiJS6RQuR3%2Fimage.png?alt=media",
        "altText": "Image label"
      }
    ],
    "actions": [
      {
        "type": "postback",
        "postback": {
          "text": "Postback action",
          "payload": "postback-payload"
        }
      },
      {
        "type": "reply",
        "reply": {
          "text": "Reply action"
        }
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FPhCxZYp0iqHwA0OnQ0Ly%2Fimage.png?alt=media&#x26;token=32609eb7-f507-4370-922e-0890982db4d3" alt=""></td></tr></tbody></table>

#### **Multiple images message with labels and postback actions**

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers><code class="lang-json">{
  "type": "image",
  "image": {
    "images": [
      {
        "altText": "First image label",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FrEM9zztd8SEiJS6RQuR3%2Fimage.png?alt=media"
      },
      {
        "altText": "Second image label",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FRPPgQAGyZE7rvIh3WM2Z%2Fimage2.avif?alt=media"
      }
    ],
    "text": "Multiple images message with postback actions",
    "actions": [
      {
        "type": "postback",
        "postback": {
          "payload": "postback-payload-1",
          "text": "Postback action 1"
        }
      },
      {
        "postback": {
          "payload": "postback-payload-2",
          "text": "Postback action 2"
        },
        "type": "postback"
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FSPfuxgXES8Te6Xl3SDRd%2Fimage.png?alt=media&#x26;token=cd4526f6-a623-44c6-a504-bca0c8161f37" alt=""></td></tr></tbody></table>

#### Multiple images message with reply actions

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers><code class="lang-json">{
  "type": "image",
  "image": {
    "images": [
      {
        "altText": "First image label",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FrEM9zztd8SEiJS6RQuR3%2Fimage.png?alt=media"
      },
      {
        "altText": "Second image label",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FRPPgQAGyZE7rvIh3WM2Z%2Fimage2.avif?alt=media"
      }
    ],
    "text": "Multiple images message with reply actions",
    "actions": [
      {
        "type": "reply",
        "reply": {
          "text": "Reply action 1"
        }
      },
      {
        "reply": {
          "text": "Reply action 2"
        },
        "type": "reply"
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FKfKWeurJi9t3TIt83P6t%2Fimage.png?alt=media&#x26;token=d13f9f88-7e85-4376-8da5-d3fbc005e46f" alt=""></td></tr></tbody></table>

#### Multiple images message with labels, postback and reply actions

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers><code class="lang-json">{
  "type": "image",
  "image": {
    "images": [
      {
        "altText": "First image label",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FrEM9zztd8SEiJS6RQuR3%2Fimage.png?alt=media"
      },
      {
        "altText": "Second image label",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FRPPgQAGyZE7rvIh3WM2Z%2Fimage2.avif?alt=media"
      }
    ],
    "text": "Multiple images message with postback and reply actions",
    "actions": [
      {
        "type": "postback",
        "postback": {
          "payload": "postback-payload",
          "text": "Postback action"
        }
      },
      {
        "reply": {
          "text": "Reply action"
        },
        "type": "reply"
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2Fx5aYjwvCeLHFg27Q97TY%2Fimage.png?alt=media&#x26;token=d894c320-c4ec-4bec-90fa-afbc7205abc7" alt=""></td></tr></tbody></table>

### File

#### Single file message

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers><code class="lang-json">{
  "type": "file",
  "file": {
    "text": "Single file message",
    "files": [
      {
        "contentType": "video/mp4",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FtXMQ4lIinia9ehf4EpC4%2Fvideo.mp4?alt=media"
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2F8z9P8ji6JRauKCXV14i5%2Fimage.png?alt=media&#x26;token=205d5988-0342-4b7c-add5-988650b0ab4f" alt=""></td></tr></tbody></table>

**Single file message with postback and reply actions**

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers data-expandable="true"><code class="lang-json">{
  "type": "file",
  "file": {
    "text": "Single file message",
    "files": [
      {
        "contentType": "video/mp4",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FtXMQ4lIinia9ehf4EpC4%2Fvideo.mp4?alt=media"
      }
    ],
    "actions": [
      {
        "type": "postback",
        "postback": {
          "text": "Postback action"
        }
      },
      {
        "type": "reply",
        "reply": {
          "text": "Reply action"
        }
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FU6C1e4aqXw0mvbuzGdPw%2Fimage.png?alt=media&#x26;token=e06de1c1-ef63-483a-9588-ea3dcb27c2ca" alt=""></td></tr></tbody></table>

**Multiple files message**

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers><code class="lang-json">{
  "type": "file",
  "file": {
    "text": "Multiple files message",
    "files": [
      {
        "contentType": "video/mp4",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FtXMQ4lIinia9ehf4EpC4%2Fvideo.mp4?alt=media"
      },
      {
        "contentType": "application/pdf",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FPnRToYX2feW96HAOrh4x%2Fdocument.pdf?alt=media"
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2Fp2qobexp4zLcX3uFni7N%2Fimage.png?alt=media&#x26;token=89442c4f-8d96-4f85-a609-bca40d43df3d" alt=""></td></tr></tbody></table>

#### Multiple files message with filename

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers><code class="lang-json">{
  "type": "file",
  "file": {
    "text": "Multiple files message",
    "files": [
      {
        "contentType": "video/mp4",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FtXMQ4lIinia9ehf4EpC4%2Fvideo.mp4?alt=media"
      },
      {
        "contentType": "application/pdf",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FPnRToYX2feW96HAOrh4x%2Fdocument.pdf?alt=media",
        "filename": "passport.pdf"
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2F41a6sv2V0oHtnAZHEdgw%2Fimage.png?alt=media&#x26;token=68d6bb2a-05f3-43a4-99e3-a93f84e8d625" alt=""></td></tr></tbody></table>

#### Multiple files message with two postback actions and a reply action&#x20;

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers data-expandable="true"><code class="lang-json">{
  "type": "file",
  "file": {
    "text": "Multiple files message",
    "files": [
      {
        "contentType": "video/mp4",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FtXMQ4lIinia9ehf4EpC4%2Fvideo.mp4?alt=media"
      },
      {
        "contentType": "application/pdf",
        "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FPnRToYX2feW96HAOrh4x%2Fdocument.pdf?alt=media",
        "filename": "passport.pdf"
      }
    ],
    "actions": [
      {
        "type": "postback",
        "postback": {
          "text": "Postback action 1",
          "payload": "postback-payload-1"
        }
      },
      {
        "type": "postback",
        "postback": {
          "text": "Postback action 2",
          "payload": "postback-payload-2"
        }
      },
      {
        "type": "reply",
        "reply": {
          "text": "Reply action"
        }
      }
    ]
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FRqr3wzuYmXC81OGd0zhG%2Fimage.png?alt=media&#x26;token=f09318e2-8eb8-4e16-afdf-e731daee5f76" alt=""></td></tr></tbody></table>

### Location

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers><code class="lang-json">{
 "type": "location",
 "location": {
   "coordinates": {
<strong>     "latitude": 52.3435942,
</strong>     "longitude": 4.9091077
   },
   "location": {
     "address": "Trompenburgstraat 2C, 1079 TX Amsterdam",
     "label": "MessageBird Amsterdam office"
   }
 }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2F06vDEoA7GglD9QqpUg8K%2Fimage.png?alt=media&#x26;token=8eb48356-002d-48d1-a2df-8524d8fc6000" alt=""></td></tr></tbody></table>

### List

#### List message without sections

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers data-expandable="true"><code class="lang-json">{
  "type": "list",
  "list": {
    "items": [
      {
        "actions": [
          {
            "type": "postback",
            "postback": {
              "payload": "postback-action-payload-1",
              "text": "Postback action 1"
            }
          },
          {
            "type": "postback",
            "postback": {
              "payload": "postback-action-payload-2",
              "text": "Postback action 2"
            }
          }
        ]
      }
    ],
    "title": "List title",
    "altText": "List alt text",
    "text": "List text"
  }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FYv0lwMqDQq4tVL9fBYQC%2Fimage.png?alt=media&#x26;token=2ec7b72d-520f-4cfb-a450-9b616ba9c645" alt=""></td></tr></tbody></table>

#### List message with sections

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers data-expandable="true"><code class="lang-json">{

"type": "list",
"list": {
"items": \[
{
"title": "Section 1",
"actions": \[
{
"type": "postback",
"postback": {
"payload": "postback-action-payload-1",
"text": "Postback action 1"
}
},
{
"type": "postback",
"postback": {
"payload": "postback-action-payload-2",
"text": "Postback action 2"
}
}
]
},
{
"title": "Section 2",
"actions": \[
{
"type": "postback",
"postback": {
"payload": "postback-action-payload-3",
"text": "Postback action 3"
}
},
{
"type": "postback",
"postback": {
"payload": "postback-action-payload-4",
"text": "Postback action 4"
}
}
]
}
],
"title": "List title",
"altText": "List alt text",
"text": "List text"
}
} </code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FHKyas2TnAwjzBVbaJBTu%2Fimage.png?alt=media&#x26;token=a9a8aaab-0888-44f9-a2ac-0d6e14821488" alt=""></td></tr></tbody></table>

#### List message with sections and custom button label

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-line-numbers data-expandable="true"><code class="lang-json">{
  "type": "list",
  "list": {
    "items": [
      {
        "title": "Section 1",
        "actions": [
          {
            "type": "postback",
            "postback": {
              "payload": "postback-action-payload-1",
              "text": "Postback action 1",
              "metadata": {
                "description": {
                  "label": "Postback action description 1"
                }
              }
            }
          },
          {
            "type": "postback",
            "postback": {
              "payload": "postback-action-payload-2",
              "text": "Postback action 2",
              "metadata": {
                "description": {
                  "label": "Postback action description 2"
                }
              }
            }
          }
        ]
      },
      {
        "title": "Section 2",
        "actions": [
          {
            "type": "postback",
            "postback": {
              "payload": "postback-action-payload-3",
              "text": "Postback action 3",
              "metadata": {
                "description": {
                  "label": "Postback action description 3"
                }
              }
            }
          },
          {
            "type": "postback",
            "postback": {
              "payload": "postback-action-payload-4",
              "text": "Postback action 4",
              "metadata": {
                "description": {
                  "label": "Postback action description 4"
                }
              }
            }
          }
        ]
      }
    ],
    "title": "List title",
    "altText": "List alt text",
    "text": "List text",
    "metadata": {
      "button": {
        "label": "Show options"
      }
    }
  }
}

</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FDLNSKKjl5dIwrxXunIzQ%2Fimage.png?alt=media&#x26;token=c2c8cba2-2ae6-4de7-b70f-a6d403147b20" alt=""></td></tr></tbody></table>

### Carousel

Carousel messages must contain:

1. `body.carousel.text` - this contains the text for the bubble before the carousel
2. Between 2-10 cards.&#x20;
   1. `mediaUrl` where media type is either all image or all video
      1. Image types - `image/jpeg`, `image/png`
      2. Video types - `video/mp4`, `video/3gpp`
   2. Card `title`
   3. One link action button

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-overflow="wrap" data-line-numbers data-expandable="true"><code class="lang-json">{
  "type": "carousel",
  "carousel": {
    "text": "Here is a media carousel with link actions",
    "items": [
      {
        "title": "Card 1",
        "mediaUrl": "https://bird.com/images/image1.jpg",
        "actions": [
          {
            "type": "link",
            "link": {
              "text": "Visit Bird",
              "url": "https://www.bird.com"
            }
          }
        ]
      },
      {
        "title": "Card 2",
        "mediaUrl": "https://bird.com/images/image2.jpg",
        "actions": [
          {
            "type": "link",
            "link": {
              "text": "Visit Bird",
              "url": "https://www.bird.com"
            }
          }
        ]
      }
    ]
  }
}
</code></pre></td><td><div><figure><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FcGtLHhpLc4DK6yuzcuT7%2Fimage.png?alt=media&#x26;token=a16ce134-e02d-4165-9f23-fd726e890b7a" alt=""><figcaption></figcaption></figure></div></td></tr></tbody></table>

### ReplyTo

You can send any outbound message as a reply to a previous message by setting the replyTo object as shown below. The **replyTo.id** should be set to the id of a received message and the **replyTo.type** should be set to "message"

{% code overflow="wrap" lineNumbers="true" %}

```json
{
 "receiver": {
   "contacts": [
     {
       "identifierValue": "+31612345678"
     }
   ]
 },
 "body": {...},
 "replyTo": {
   "id": "<recievedmessageid>",
   "type": "message"
 }
}
```

{% endcode %}

#### ReplyTo with a text message

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-overflow="wrap" data-line-numbers><code class="lang-json">{
    "type": "text",
    "text": {
        "text": "Single text message"
    },
    "replyTo": {
        "id": "1e7b70ab-3dcc-48f4-a6f6-63a493f6134c",
        "type": "message"
    }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FOKAbto5zOiLF909srIix%2Fimage.png?alt=media&#x26;token=6cc91343-0cf3-40eb-bed4-62d617377b1f" alt="" data-size="original"></td></tr></tbody></table>

#### ReplyTo with an image message

<table data-header-hidden><thead><tr><th width="373"></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-overflow="wrap" data-line-numbers data-expandable="true"><code class="lang-json">{
    "type": "image",
    "image": {
        "images": [
            {
                "altText": "Label of first image",
                "mediaUrl": "https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FRPPgQAGyZE7rvIh3WM2Z%2Fimage2.avif?alt=media"
            }
        ]
    },
    "replyTo": {
        "id": "1e7b70ab-3dcc-48f4-a6f6-63a493f6134c",
        "type": "message"
    }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FR4zZduoCza2fevpK8JB9%2Fimage.png?alt=media&#x26;token=5642db78-8450-45c6-ad81-051583ab4fbb" alt="" data-size="original"></td></tr></tbody></table>

#### ReplyTo with text message with postback actions

<table data-header-hidden><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><pre class="language-json" data-overflow="wrap" data-line-numbers data-expandable="true"><code class="lang-json">{
    "type": "text",
    "text": {
        "text": "Single text message with postback actions",
        "actions": [
            {
                "type": "postback",
                "postback": {
                    "text": "Postback action 1",
                    "payload": "postback-payload-1"
                }
            },
            {
                "type": "postback",
                "postback": {
                    "text": "Postback action 2",
                    "payload": "postback-payload-2"
                }
            }
        ]
    },
    "replyTo": {
        "id": "1e7b70ab-3dcc-48f4-a6f6-63a493f6134c",
        "type": "message"
    }
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FSjjfgIEC0GmklXN7nFV5%2Fimage.png?alt=media&#x26;token=921de482-5214-4d4c-a712-a2f84ecd7b7c" alt="" data-size="original"></td></tr></tbody></table>

### Template

Template is the only message type that can be sent by a business to a recipient outside the customer service window, however, a prior opt-in is required. Templates must be active in [Studio](https://docs.bird.com/api/channels-api/supported-channels/programmable-whatsapp/broken-reference) and, therefore, pre-approved by Meta, before they are used. It's also important to note that the code snippets below must be set in the message template field

{% code lineNumbers="true" %}

```json
{
 "receiver": {
   "contacts": [
     {
       "identifierValue": "+31612345678"
     }
   ]
 },
 "template": {...}
}
```

{% endcode %}

#### &#x20;Text template with variable

<table data-header-hidden><thead><tr><th></th><th></th><th></th></tr></thead><tbody><tr><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2Fap72CFjEmHC1mzVis3Fy%2Fimage.png?alt=media&#x26;token=246250cb-d2bd-4546-8082-5310486458a3" alt=""></td><td><pre class="language-json" data-overflow="wrap" data-line-numbers><code class="lang-json">{  "projectId":"ce6a2fd6-b2fa-4f5a-a2cd-f3bd15883318",
   "version":"latest",
   "locale":"en",
   "parameters":[
      {
         "type":"string",
         "key":"name",
         "value":"Robert"
      }
   ]
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FB6z5rJ5bmEpSfxmyH0Bo%2Fimage.png?alt=media&#x26;token=d8d082a6-f944-42f9-b5e6-e2959f2619cf" alt=""></td></tr></tbody></table>

#### Image template with button and variables

<table data-header-hidden><thead><tr><th></th><th></th><th></th></tr></thead><tbody><tr><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FTz2P32ZEfWJH502YdefY%2Fimage.png?alt=media&#x26;token=43a3a2dc-e7a2-404f-81d2-0a157cba018e" alt="" data-size="original"></td><td><pre class="language-json" data-overflow="wrap" data-line-numbers><code class="lang-json">{  "projectId":"7b492653-450b-4e97-b5e4-3827868e7438",
   "version":"latest",
   "locale":"en",
   "parameters":[
      {
         "type":"string",
         "key":"imageURL",
         "value":"https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FRPPgQAGyZE7rvIh3WM2Z%2Fimage2.avif?alt=media"
      }
   ]
}
</code></pre></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2F2uHa7l7LbDrPmCCGOFQD%2Fimage.png?alt=media&#x26;token=f787ad2d-c81c-4b95-b4a6-f6dc26b683cc" alt=""></td></tr></tbody></table>

#### Image with a variable in a button

<table data-header-hidden><thead><tr><th></th><th></th><th></th></tr></thead><tbody><tr><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2FWsoaXQljdIiyZH7b3PbV%2Fimage.png?alt=media&#x26;token=c60c7222-a260-4a6a-b3c7-d828f8959d5c" alt=""></td><td><pre class="language-json" data-overflow="wrap" data-line-numbers><code class="lang-json">{   "projectId":"6449eb42-dffb-41c2-81a1-7fd956d2e7a6",
   "version":"e0e9190c-c3e7-4026-8fc3-d28a77aa1a52",
   "locale":"en",
   "parameters":[
      {
         "type":"string",
         "key":"name",
         "value":"Robert"
      },
      {
         "type":"string",
         "key":"url",
         "value":"?campaignid=123456"
      }
   ]
}
</code></pre><p>   </p></td><td><img src="https://3210271997-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FdnJZeZvhOMhDQA8SpjQM%2Fuploads%2Fc9H37kbbk0gt7q9pA6tE%2Fimage.png?alt=media&#x26;token=f77a168d-4975-439d-9357-d8ecf77ae789" alt=""></td></tr></tbody></table>
