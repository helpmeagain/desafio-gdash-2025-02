import { Injectable } from "@nestjs/common";

@Injectable()
export class SourceService {
  getRepoLink() {
    return {
      repository: "https://github.com/helpmeagain/desafio-gdash-2025-02",
    };
  }

  getLicense() {
    return {
      name: "GNU Affero General Public License v3.0",
      short: "AGPLv3",
      url: "https://www.gnu.org/licenses/agpl-3.0.html",
      repositoryLicense:
        "https://github.com/helpmeagain/desafio-gdash-2025-02/blob/main/LICENSE",
    };
  }
}
