// Привіт! Сподіваюсь вам сподобається, я старався, буду радий вашому фідбеку :)

// 1) В нас як я зрозумів меседжи та файли можуть бути будь-які види ключів строк
// та значень строк, тому  [key: string]: string;

interface IFilesMessages {
  [key: string]: string;
}

interface IFilesList {
  [key: string]: string;
}

// 2) Так, ми могли б не робити цих два типа і просто заасайнути строку (file: string)
// Але інтерфейс може потенційно змінитися, тому
// в нас типи мають залежати один від одного, щоб код був куди стабільнішим

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
  saveMessages: (messages: IParsedMessage[], file: TypeFilesOutputs) => void;
}

// 3) обробка помилки має бути завжди при використанні запитів на сервер (тут мок, але тим не менш)
// оскільки я не хочу порушувати солід (а саме Single Responsibility)
// я вирішив зробити просто отримання дати та обробку потенційного фейл ріквеста без ніяких зайвих дій
// і винести то в сервіс, який можна перевикористовувати в апці

class FileService implements IFilesMessageservice {
  public async getFilesMessages(): Promise<IFilesMessages | void> {
    try {
      // *представляємо, що це наш фетч*
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
      return mockResponses;
    } catch (e) {
      // тут хендлимо ерор як потрібно під наші бізнес задачі
    }
  }
}

// 4) В хелпері лежать методи які ми потенційно можемо заюзати в будь-якій частині апки
// Наприклад ділей

class Helpers {
  public static async delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}

// 5) В реальній апці FileParser міг би наслідуватися від базової сутності Parser
// але тут нам одного FileParser хватить :)

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
      `Saved message - ${onmessage} to ${file} as ${
        onmessage.length > 8 ? "long" : "short"
      }`
    );
  }

  saveMessages(messages: IParsedMessage[], file: TypeFilesOutputs): void {
    messages.map((item) => {
      const task = (async () => {
        await Helpers.delay(Math.random() * 5 * 1000);
        this.saveMessage(item.message, file);
      })();
      return task;
    });
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

          if (!messages || !(input in messages)) throw new Error(); // Редірект в кетч блок з резолвом

          const parsedMessages = this.parser.getParsedMessages(messages, input);
          this.messageController.saveMessages(parsedMessages, output);

          resolve();
        } catch (e) {
          resolve();
          // Як було сказано в завданні, якщо помилка при парсінгу або при записанні,
          // то резолвнути БЕЗ помилки, тому ми  робимо в будь-якому випадку резолв
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
