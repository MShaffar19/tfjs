/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

// tslint:disable-next-line: no-imports-from-dist
import * as tensorflow from '@tensorflow/tfjs-converter/dist/data/compiled_api';
import {io} from '@tensorflow/tfjs-core';
import * as fs from 'fs';

import {esmModuleProvider} from './esm_module_provider';

export function getOps(modelJson: io.ModelArtifacts): string[] {
  const kernel2op = kernelToOpMapping();
  const results: Set<string> = new Set();

  const addOpsToResults = (kernel: string) => {
    const ops = kernel2op[kernel];
    if (ops == null) {
      console.warn(
          `Kernel => Op warning: could not find op mapping for kernel ${
              kernel}`);
    }
    ops.forEach((op: string) => results.add(op));
  };

  const graph = modelJson.modelTopology as tensorflow.IGraphDef;

  // Parse nodes
  if (graph.node != null) {
    graph.node.forEach((node) => addOpsToResults(node.op));
  }

  // Parse functionDef nodes
  if (graph.library != null && graph.library.function !== null) {
    graph.library.function.forEach((functionDef) => {
      const nodeDef = functionDef.nodeDef;
      if (nodeDef != null) {
        nodeDef.forEach((node) => addOpsToResults(node.op));
      }
    });
  }

  return Array.from(results);
}

function kernelToOpMapping() {
  const mappingPath = esmModuleProvider.kernelToOpsMapPath();
  return JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
}
