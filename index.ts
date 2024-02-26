// Hello! I hope you like it, I did my best, and I'll be glad to hear your feedback :)

// 1) As I understand it, messages and files can be any type of string keys and string values, so [key: string]: string;

interface IFilesMessages {
  [key: string]: string;
}

interface IFilesList {
  [key: string]: string;
}

// 2) Yes, we could have just assigned a string (file: string) instead of defining these two types. But since the interface may potentially change, our types should depend on each other to make the code more stable.

type TypeFilesInputs = keyof IFilesList;
type TypeFilesOutputs = IFilesList[keyof IFilesList];

interface IParsedMessage {
  message: string;
  timestamp: string;
}

interface IFilesMessageservice {
  getFilesMessages: () => Promise<IFilesMessages | void>;
}

interface IFileParser {
  getParsedMessages: (
    message: IFilesMessages,
    file: TypeFilesInputs
  ) => IParsedMessage[];
}

interface IMessageController {
  saveMessage: (onmessage: string, file: TypeFilesOutputs) => void;
  saveMessages: (messages: IParsedMessage[], file: TypeFilesOutputs) => Promise<void>;
}

const mockResponses: IFilesMessages = {
  "file1.txt": `Hello world! : 2024-02-22 14:35:30 UTC
  Goodbye world! : 2024-02-22 16:35:30 UTC
  Hello? : 2024-02-22 08:35:30 UTC
 Hi : 2024-02-22 12:35:30 UTC`,
  "file2.txt": `How are you doing ? : 2024-02-22 13:59:30 UTC
  Fine : 2024-02-22 12:44:30 UTC
  How about you ? : 2024-02-22 22:35:30 UTC
  Same : 2024-02-22 07:39:30 UTC`,
  "file3.txt": `Have you seen high elves ? : 2022-02-22 14:35:30 UTC
  HESOYAM : 2023-02-22 14:35:30 UTC
  BAGUVIX : 2021-02-22 14:35:30 UTC
  THERE IS NO SPOON : 2020-02-22 14:35:30 UTC`,
};


// 3) Error handling should always be present when making server requests (here it's mocked, but nonetheless). Since I don't want to violate the Single Responsibility principle, I decided to simply retrieve the date and handle any potential failed requests without any extra actions, and move that into a service that can be reused in the application.

class FileService implements IFilesMessageservice {
  public async getFilesMessages(): Promise<IFilesMessages | void> {
    try {
      // *pretend this is our fetch*
      return mockResponses;
    } catch (e) {
      // handle error as needed for our business tasks
    }
  }
}

// 4) The helper contains methods that we could potentially use anywhere in the app, like delay.

class Helpers {
  public static async delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}

// 5) In a real application, FileParser could inherit from a base entity Parser, but one FileParser is enough for us here :)

class FileParser implements IFileParser {
  getParsedMessages(
    messages: IFilesMessages,
    file: TypeFilesInputs
  ): IParsedMessage[] {
    if (messages && file in messages) {
      const content = messages[file].split("\n").map((item) => {
        const [message, timestamp] = item.split(":");
        return { message, timestamp };
      });

      return content;
    }
    return [];
  }
}

class MessageController implements IMessageController {
  saveMessage(onmessage: string, file: TypeFilesOutputs): void {
    console.log(
      `Saved message - ${onmessage} to ${file} as ${onmessage.length > 8 ? "long" : "short"
      }`
    );
  }

  async saveMessages(messages: IParsedMessage[], file: TypeFilesOutputs): Promise<void> {
    await Promise.all(messages.map(async (item) => {
      try {
        await Helpers.delay(Math.random() * 5 * 1000);
        this.saveMessage(item.message, file);
      } catch (error) {}
    }));
  }
  
}

class FileController {
  constructor(
    private readonly parser: IFileParser,
    private readonly fileService: IFilesMessageservice,
    private readonly messageController: IMessageController
  ) {
    this.fileService = fileService;
    this.parser = parser;
    this.messageController = messageController;
  }

  handleFiles(files: IFilesList) {
    Object.entries(files).forEach(([input, output]) => {
      new Promise<void>(async (resolve) => {
        try {
  
          const messages = await this.fileService.getFilesMessages();
          if (!messages || !(input in messages)) {
            resolve()
            return
          }

          const parsedMessages = this.parser.getParsedMessages(messages, input);
          await this.messageController.saveMessages(parsedMessages, output);

          resolve();
        } catch (e) {
          resolve();
          // As mentioned in the task, if there's an error during parsing or saving,
          // resolve WITHOUT an error, so we resolve in any case.
        }
      });
    });
  }
}

const files: IFilesList = {
  "file1.txt": "out1.txt",
  "file2.txt": "out2.txt",
  "file3.txt": "out3.txt",
};

new FileController(
  new FileParser(),
  new FileService(),
  new MessageController()
).handleFiles(files);